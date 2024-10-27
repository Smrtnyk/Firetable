import type { GuestDoc, PropertyDoc, Visit } from "@firetable/types";
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
    guestId: string;
    propertyId: string;
    propertyName: string;
    totalReservations: number;
    fulfilledVisits: number;
    visitPercentage: string;
};

type PropertyEvents = Record<string, Visit | null>;

export const useGuestsStore = defineStore("guests", function () {
    const refsMap = new Map<string, _RefFirestore<VueFirestoreQueryData<GuestDoc>>>();
    const authStore = useAuthStore();
    const propertiesStore = usePropertiesStore();
    const guestsCache = new Map<string, GuestDoc>();

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
        events: PropertyEvents,
    ): Omit<GuestSummary, "guestId"> | undefined {
        const property = findProperty(propertyId);
        if (!property) {
            return undefined;
        }

        const { totalReservations, fulfilledVisits, visitPercentage } = calculateVisitStats(events);

        return {
            propertyId: property.id,
            propertyName: property.name,
            totalReservations,
            fulfilledVisits,
            visitPercentage,
        };
    }

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

    async function getGuestByHashedContact(
        organisationId: string,
        hashedContact: string,
    ): Promise<VueFirestoreDocumentData<GuestDoc> | undefined> {
        const guests = refsMap.get(organisationId);
        if (guests?.data.value) {
            const foundGuest = guests.data.value.find(
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

        const eventsExcludingSpecified = { ...events };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- just for now
        delete eventsExcludingSpecified[eventIdToExclude];

        const summary = createPropertySummary(propertyId, eventsExcludingSpecified);
        if (!summary) {
            AppLogger.info("No events found for the property after excluding the specified event");
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

    return {
        getGuestByHashedContact,
        invalidateGuestCache,
        getGuestSummaryForPropertyExcludingEvent,
        getGuests,
        guestReservationsSummary,
    };
});

function calculateVisitStats(events: PropertyEvents): {
    totalReservations: number;
    fulfilledVisits: number;
    visitPercentage: string;
} {
    const nonNullEvents = Object.values(events).filter((event): event is Visit => event !== null);

    const totalReservations = nonNullEvents.length;

    const fulfilledVisits = nonNullEvents.filter(
        (event) => event.arrived && !event.cancelled,
    ).length;

    const visitPercentage =
        totalReservations > 0 ? ((fulfilledVisits / totalReservations) * 100).toFixed(2) : "0.00";

    return { totalReservations, fulfilledVisits, visitPercentage };
}
