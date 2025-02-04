import type { GuestsSubscriptionCallback } from "@firetable/backend";
import type { GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import type { Ref } from "vue";
import type { VueFirestoreDocumentData } from "vuefire";

import { getGuestsPath, subscribeToGuests } from "@firetable/backend";
import { chunk, omit, omitBy } from "es-toolkit";
import { first, matchesProperty } from "es-toolkit/compat";
import { isNotNil } from "es-toolkit/predicate";
import { where } from "firebase/firestore";
import { defineStore } from "pinia";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { AppLogger } from "src/logger/FTLogger";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { ref } from "vue";

export type GuestSummary = {
    fulfilledVisits: number;
    guestId: string;
    propertyId: string;
    propertyName: string;
    totalReservations: number;
    visitPercentage: string;
};

type GuestsState = {
    data: GuestDoc[];
    pending: boolean;
};

type PropertyEvents = Record<string, null | Visit>;

export const useGuestsStore = defineStore("guests", function () {
    const refsMap = ref(new Map<string, Ref<GuestsState>>());
    const unsubMap = new Map<string, () => void>();
    const guestsCache = new Map<string, GuestDoc>();
    const authStore = useAuthStore();
    const propertiesStore = usePropertiesStore();

    function hasPropertyAccess(propertyId: string): boolean {
        return (
            authStore.isAdmin || authStore.nonNullableUser.relatedProperties.includes(propertyId)
        );
    }

    function findProperty(propertyId: string): PropertyDoc | undefined {
        return propertiesStore.properties.find(matchesProperty("id", propertyId));
    }

    function createPropertySummary(
        propertyId: string,
        events: Partial<PropertyEvents>,
    ): Omit<GuestSummary, "guestId"> | undefined {
        const property = findProperty(propertyId);
        if (!property) {
            return undefined;
        }

        const { fulfilledVisits, totalReservations, visitPercentage } = calculateVisitStats(events);

        return {
            fulfilledVisits,
            propertyId: property.id,
            propertyName: property.name,
            totalReservations,
            visitPercentage,
        };
    }

    function getGuests(organisationId: string): Ref<GuestsState> {
        const existingRef = refsMap.value.get(organisationId);
        if (existingRef) {
            return existingRef;
        }

        const state = ref<GuestsState>({
            data: [],
            pending: true,
        });
        refsMap.value.set(organisationId, state);

        const callbacks: GuestsSubscriptionCallback = {
            onAdd(guest) {
                state.value = {
                    data: [...state.value.data, guest],
                    pending: state.value.pending,
                };
                if (guest.hashedContact) {
                    guestsCache.set(guest.hashedContact, guest);
                }
            },
            onError(error) {
                AppLogger.error("Error fetching guests:", error);
                state.value.pending = false;
            },
            onModify(guest) {
                state.value = {
                    data: state.value.data.map(function (existingGuest) {
                        return existingGuest.id === guest.id ? guest : existingGuest;
                    }),
                    pending: state.value.pending,
                };
                if (guest.hashedContact) {
                    guestsCache.set(guest.hashedContact, guest);
                }
            },
            onReady() {
                state.value.pending = false;
            },
            onRemove(guestId) {
                state.value = {
                    data: state.value.data.filter(({ id }) => id !== guestId),
                    pending: state.value.pending,
                };
            },
        };

        const unsubscribe = subscribeToGuests(organisationId, callbacks);
        unsubMap.set(organisationId, unsubscribe);

        return state;
    }

    function invalidateGuestCache(guestId: string): void {
        for (const [hashedContact, guest] of guestsCache.entries()) {
            if (guest.id === guestId) {
                guestsCache.delete(hashedContact);
                AppLogger.info(`Cache invalidated for guest ${guestId}`);
                return;
            }
        }
        AppLogger.info(`No cached guest found with id ${guestId}`);
    }

    async function getGuestsByHashedContacts(
        organisationId: string,
        hashedContacts: string[],
    ): Promise<GuestDoc[]> {
        if (hashedContacts.length === 0) {
            return [];
        }
        const guests = refsMap.value.get(organisationId);
        let hashedContactsToFetch = [...hashedContacts];
        let foundGuests: GuestDoc[] = [];
        if (guests?.value.data) {
            foundGuests = guests.value.data.filter(function (guest) {
                return hashedContacts.includes(guest.hashedContact);
            });

            if (foundGuests.length === hashedContactsToFetch.length) {
                AppLogger.info("All guests found in all guests cache");
                return foundGuests;
            }

            hashedContactsToFetch = hashedContacts.filter(function (hashedContact) {
                return !foundGuests.some(matchesProperty("hashedContact", hashedContact));
            });
        }

        // check cachedGuest cache if it has some guests
        for (const missingHashedContact of hashedContactsToFetch) {
            const cachedGuest = guestsCache.get(missingHashedContact);
            if (cachedGuest) {
                AppLogger.info("Guest found in guests cache");
                foundGuests.push(cachedGuest);
                hashedContactsToFetch = hashedContactsToFetch.filter(function (hashedContact) {
                    return hashedContact !== missingHashedContact;
                });
            }
        }

        if (hashedContactsToFetch.length === 0) {
            AppLogger.info("All guests found in cache");
            return foundGuests;
        }

        const chunkedHashedContactsToFirestoreLimit = chunk(hashedContactsToFetch, 30);

        AppLogger.info(
            "Guests remaining to be fetched from firestore",
            chunkedHashedContactsToFirestoreLimit.flat().join(",\n"),
        );

        const resultPromises = await Promise.all(
            chunkedHashedContactsToFirestoreLimit.flatMap(function (chunkedHashedContacts) {
                return useFirestoreCollection<GuestDoc>(
                    createQuery(
                        getGuestsPath(organisationId),
                        where("hashedContact", "in", chunkedHashedContacts),
                    ),
                    { once: true, wait: true },
                );
            }),
        );

        await Promise.all(resultPromises.map((result) => result.promise.value));

        const fetchedGuests = resultPromises.flatMap(function (result) {
            return result.data.value;
        });

        for (const fetchedGuest of fetchedGuests) {
            guestsCache.set(fetchedGuest.hashedContact, fetchedGuest);
        }

        return [...foundGuests, ...fetchedGuests];
    }

    async function getGuestByHashedContact(
        organisationId: string,
        hashedContact: string,
    ): Promise<undefined | VueFirestoreDocumentData<GuestDoc>> {
        const guests = refsMap.value.get(organisationId);
        if (guests?.value.data) {
            const foundGuest = guests.value.data.find(
                (guest) => guest.hashedContact === hashedContact,
            );
            if (foundGuest) {
                AppLogger.info("Guest found in all guests cache");
                return foundGuest;
            }
        }

        const cachedGuest = guestsCache.get(hashedContact);
        if (cachedGuest) {
            AppLogger.info("Guest found in guests cache");
            return cachedGuest;
        }

        AppLogger.info("Guest not found in cache, fetching from Firestore");
        const { data, promise } = useFirestoreCollection<GuestDoc>(
            createQuery(getGuestsPath(organisationId), where("hashedContact", "==", hashedContact)),
            { once: true, wait: true },
        );

        await promise.value;

        const foundGuest = first(data.value);
        if (foundGuest) {
            guestsCache.set(hashedContact, foundGuest);
        }

        return foundGuest;
    }

    async function getGuestSummaryForPropertyExcludingEvent(
        organisationId: string,
        hashedContact: string,
        propertyId: string,
        eventIdToExclude: string,
    ): Promise<GuestSummary | undefined> {
        const guestDoc = await getGuestByHashedContact(organisationId, hashedContact);
        if (!guestDoc) {
            AppLogger.info("Guest not found");
            return undefined;
        }

        if (!hasPropertyAccess(propertyId)) {
            AppLogger.info("Access denied to the property");
            return undefined;
        }

        const events = guestDoc.visitedProperties[propertyId];
        if (!events) {
            AppLogger.info("No events found for the property");
            return undefined;
        }
        // Filter out future visits
        const currentTimestamp = Date.now();
        const eventsExcludingSpecified = omitBy<PropertyEvents>(
            omit(events, [eventIdToExclude]),
            function (visit) {
                return isNotNil(visit) && visit.date > currentTimestamp;
            },
        );

        const summary = createPropertySummary(propertyId, eventsExcludingSpecified);
        if (!summary) {
            AppLogger.info(
                "No valid events found after excluding specified event and future visits",
            );
            return undefined;
        }

        return {
            ...summary,
            guestId: guestDoc.id,
        };
    }

    function guestReservationsSummary(guest: GuestDoc): GuestSummary[] | undefined {
        if (Object.keys(guest.visitedProperties).length === 0) {
            return undefined;
        }

        const summaries = Object.entries(guest.visitedProperties)
            .filter(([propertyId]) => hasPropertyAccess(propertyId))
            .map(function ([propertyId, events]) {
                return createPropertySummary(propertyId, events);
            });

        const validSummaries = summaries.filter(Boolean) as GuestSummary[];
        return validSummaries.length > 0 ? validSummaries : undefined;
    }

    function cleanup(): void {
        unsubMap.forEach((unsubscribe) => unsubscribe());
        unsubMap.clear();
        refsMap.value.clear();
    }

    return {
        cleanup,
        getGuestByHashedContact,
        getGuests,
        getGuestsByHashedContacts,
        getGuestSummaryForPropertyExcludingEvent,
        guestReservationsSummary,
        invalidateGuestCache,
        refsMap,
    };
});

function calculateVisitStats(events: Partial<PropertyEvents>): {
    fulfilledVisits: number;
    totalReservations: number;
    visitPercentage: string;
} {
    const nonNullEvents = Object.values(events).filter((event): event is Visit => isNotNil(event));

    const totalReservations = nonNullEvents.length;

    const fulfilledVisits = nonNullEvents.filter(
        (event) => event.arrived && !event.cancelled,
    ).length;

    const visitPercentage =
        totalReservations > 0 ? ((fulfilledVisits / totalReservations) * 100).toFixed(2) : "0.00";

    return { fulfilledVisits, totalReservations, visitPercentage };
}
