import type { BaseReservation, ReservationState } from "./base-reservation.js";
import type { PlannedReservation } from "./planned-reservation.js";
import type { QueuedReservation } from "./queued-reservation.js";

import { ReservationType } from "./base-reservation.js";

/**
 * Represents a walk-in reservation document in Firestore
 * Used for guests who arrive without a prior reservation
 */
export interface WalkInReservation extends BaseReservation {
    /**
     * Always true for walk-ins as they're already present
     */
    arrived: true;
    /**
     * Minimum consumption requirement in the default currency
     */
    consumption: number;
    /**
     * Name of the walk-in guest
     */
    guestName: string;
    /**
     * Walk-in reservations are always ARRIVED
     */
    state: ReservationState.ARRIVED;

    /**
     * Identifies this as a walk-in reservation
     */
    type: ReservationType.WALK_IN;
}

/**
 * Walk-in reservation with Firestore document ID
 */
export type WalkInReservationDoc = WalkInReservation & {
    /**
     * Firestore document ID
     */
    id: string;
};

export function isAWalkInReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is WalkInReservation {
    return reservation.type === ReservationType.WALK_IN;
}
