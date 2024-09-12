import type {
    AugmentedPlannedReservation,
    AugmentedWalkInReservation,
    ReservationBucket,
} from "src/stores/analytics-store.js";
import type { EventDoc, ReservationDocWithEventId, PropertyDoc } from "@firetable/types";
import { isAWalkInReservation, isPlannedReservation } from "@firetable/types";
import { matchesProperty } from "es-toolkit/compat";

export function bucketizeReservations(
    events: EventDoc[],
    fetchedReservations: ReservationDocWithEventId[],
    properties: PropertyDoc[],
): ReservationBucket[] {
    function getPropertyName(event: EventDoc): string | undefined {
        return properties.find(matchesProperty("id", event.propertyId))?.name;
    }

    function augmentReservation(
        event: EventDoc,
        reservation: ReservationDocWithEventId,
    ): AugmentedPlannedReservation | AugmentedWalkInReservation {
        return {
            ...reservation,
            id: reservation.id,
            date: event.date,
        };
    }

    const buckets = events.reduce<Record<string, ReservationBucket>>(function (acc, event) {
        const propertyName = getPropertyName(event);
        // Skip if property name is not found
        if (!propertyName) {
            return acc;
        }

        const bucket = acc[event.propertyId] || {
            propertyId: event.propertyId,
            propertyName,
            plannedReservations: [],
            walkInReservations: [],
        };

        // Filter and categorize reservations for the current event
        const eventReservations = fetchedReservations
            .filter(matchesProperty("eventId", event.id))
            // Skip cancelled planned reservations
            .filter(function (reservation) {
                return !isPlannedReservation(reservation) || !reservation.cancelled;
            })
            .map(function (reservation) {
                return augmentReservation(event, reservation);
            });

        eventReservations.forEach(function (reservationData) {
            if (isPlannedReservation(reservationData)) {
                bucket.plannedReservations.push(reservationData);
            } else if (isAWalkInReservation(reservationData)) {
                bucket.walkInReservations.push(reservationData);
            }
        });

        acc[event.propertyId] = bucket;
        return acc;
    }, {});

    return Object.values(buckets);
}
