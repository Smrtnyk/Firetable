import type { PlannedReservation } from "./planned-reservation.js";
import type { WalkInReservation } from "./walk-in-reservation.js";

import { ReservationType } from "./base-reservation.js";

/**
 * Represents a queued reservation document in Firestore
 * Used for managing waiting lists when tables aren't immediately available
 */
export interface QueuedReservation
    extends Omit<
        PlannedReservation,
        | "arrived"
        | "cancelled"
        | "floorId"
        | "reservationConfirmed"
        | "state"
        | "tableLabel"
        | "type"
        | "waitingForResponse"
    > {
    /**
     * Identifies this as a queued reservation
     */
    type: ReservationType.QUEUED;
}

/**
 * Queued reservation with Firestore document ID
 */
export type QueuedReservationDoc = QueuedReservation & {
    /**
     * Firestore document ID
     */
    id: string;
};

export function isQueuedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is QueuedReservation {
    return reservation.type === ReservationType.QUEUED;
}
