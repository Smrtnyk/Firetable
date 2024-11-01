import type {
    AugmentedPlannedReservation,
    AugmentedWalkInReservation,
    ReservationBucket,
} from "src/stores/analytics-store.js";
import type { EventDoc, ReservationDocWithEventId } from "@firetable/types";
import { isAWalkInReservation, isPlannedReservation } from "@firetable/types";
import { matchesProperty } from "es-toolkit/compat";

export function bucketizeReservations(
    events: EventDoc[],
    fetchedReservations: ReservationDocWithEventId[],
): ReservationBucket {
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

    const bucket: ReservationBucket = {
        plannedReservations: [],
        walkInReservations: [],
    };

    events.forEach(function (event) {
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
    });

    return bucket;
}
