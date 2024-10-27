import type { GuestDoc, Visit } from "@firetable/types";
import type { _RefFirestore, VueFirestoreDocumentData, VueFirestoreQueryData } from "vuefire";
import { defineStore } from "pinia";
import { getGuestsPath, guestsCollection } from "@firetable/backend";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { where } from "firebase/firestore";
import { first, matchesProperty } from "es-toolkit/compat";
import { AppLogger } from "src/logger/FTLogger";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";

export type GuestSummary = {
    propertyId: string;
    propertyName: string;
    totalReservations: number;
    fulfilledVisits: number;
    visitPercentage: string;
};

export const useGuestsStore = defineStore("guests", function () {
    const refsMap = new Map<string, _RefFirestore<VueFirestoreQueryData<GuestDoc>>>();
    const authStore = useAuthStore();
    const propertiesStore = usePropertiesStore();

    const guestsCache = new Map<string, GuestDoc>();

    function getGuests(organisationId: string): _RefFirestore<VueFirestoreQueryData<GuestDoc>> {
        if (!refsMap.get(organisationId)) {
            refsMap.set(
                organisationId,
                useFirestoreCollection<GuestDoc>(getGuestsPath(organisationId), {
                    wait: true,
                }),
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just set it
        return refsMap.get(organisationId)!;
    }

    async function getGuestByHashedContact(
        organisationId: string,
        hashedContact: string,
    ): Promise<VueFirestoreDocumentData<GuestDoc> | undefined> {
        const guests = refsMap.get(organisationId);
        if (guests?.data.value) {
            const foundGuest = guests.data.value.find(function (guest) {
                return guest.hashedContact === hashedContact;
            });

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
            createQuery(
                guestsCollection(organisationId),
                where("hashedContact", "==", hashedContact),
            ),
            { once: true, wait: true },
        );

        await promise.value;

        const foundGuest = first(data.value);

        if (foundGuest) {
            guestsCache.set(hashedContact, foundGuest);
            return foundGuest;
        }

        return void 0;
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

        // Check if the user has access to the property
        const isAdmin = authStore.isAdmin;
        const relatedProperties = authStore.nonNullableUser.relatedProperties;
        if (!isAdmin && !relatedProperties.includes(propertyId)) {
            AppLogger.info("Access denied to the property");
            return undefined;
        }

        // Find the property details
        const properties = propertiesStore.properties;
        const property = properties.find(matchesProperty("id", propertyId));
        if (!property) {
            AppLogger.info("Property not found");
            return undefined;
        }

        // Get the events related to the property
        const events = guestDoc.visitedProperties[propertyId];
        if (!events) {
            AppLogger.info("No events found for the property");
            return undefined;
        }

        // Exclude the specified event
        const eventsExcludingSpecified = { ...events };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- just for now
        delete eventsExcludingSpecified[eventIdToExclude];

        const totalReservations = Object.values(eventsExcludingSpecified).filter(
            (event): event is Visit => event !== null,
        ).length;

        const fulfilledVisits = Object.values(eventsExcludingSpecified).filter(
            (event): event is Visit => event !== null && event.arrived && !event.cancelled,
        ).length;

        const visitPercentage =
            totalReservations > 0
                ? ((fulfilledVisits / totalReservations) * 100).toFixed(2)
                : "0.00";

        return {
            propertyId: property.id,
            propertyName: property.name,
            totalReservations,
            fulfilledVisits,
            visitPercentage,
        };
    }

    function guestReservationsSummary(guest: GuestDoc): GuestSummary[] | undefined {
        if (Object.keys(guest.visitedProperties).length === 0) {
            return undefined;
        }

        const isAdmin = authStore.isAdmin;
        const relatedProperties = authStore.nonNullableUser.relatedProperties;
        const properties = propertiesStore.properties;

        const summaries = Object.entries(guest.visitedProperties)
            .filter(function ([propertyId]) {
                // Admins see all properties
                if (isAdmin) {
                    return true;
                }
                // Non-admins only see properties in their relatedProperties
                return relatedProperties.includes(propertyId);
            })
            .map(function ([propertyId, events]) {
                const property = properties.find(matchesProperty("id", propertyId));
                if (!property) {
                    return null;
                }

                // Total reservations: count of non-null events
                const totalReservations = Object.values(events).filter(
                    function (event): event is Visit {
                        return event !== null;
                    },
                ).length;

                // Fulfilled visits: arrived and not canceled
                const fulfilledVisits = Object.values(events).filter(
                    function (event): event is Visit {
                        return event !== null && event.arrived && !event.cancelled;
                    },
                ).length;

                // Calculate visit percentage
                const visitPercentage =
                    totalReservations > 0
                        ? ((fulfilledVisits / totalReservations) * 100).toFixed(2)
                        : "0.00";

                return {
                    propertyId: property.id,
                    propertyName: property.name,
                    totalReservations,
                    fulfilledVisits,
                    visitPercentage,
                };
            });

        return summaries.filter(Boolean) as GuestSummary[];
    }

    return {
        getGuestSummaryForPropertyExcludingEvent,
        getGuests,
        guestReservationsSummary,
    };
});
