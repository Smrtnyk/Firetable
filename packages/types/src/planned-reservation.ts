import type { BaseReservation, UserIdentifier } from "./base-reservation.js";
import type { QueuedReservation } from "./queued-reservation.js";
import type { WalkInReservation } from "./walk-in-reservation.js";

import { ReservationType } from "./base-reservation.js";

/**
 * Represents a planned reservation document in Firestore
 * Used for advance bookings with specific requirements
 */
export interface PlannedReservation extends BaseReservation {
    /**
     * Whether the guest has physically arrived
     */
    arrived: boolean;
    /**
     * Whether the reservation has been cancelled
     */
    cancelled: boolean;
    /**
     * Minimum consumption requirement, can be in any currency or in amount of bottles
     */
    consumption: number;
    /**
     * Name of the guest making the reservation
     */
    guestName: string;
    /**
     * Whether the guest has confirmed their attendance
     */
    reservationConfirmed: boolean;
    /**
     * Contact details of the person who made the reservation
     */
    reservedBy: UserIdentifier;
    /**
     * Identifies this as a planned reservation
     */
    type: ReservationType.PLANNED;
    /**
     * Whether we're waiting for the guest to respond
     */
    waitingForResponse?: boolean;
}

/**
 * Planned reservation with Firestore document ID
 */
export type PlannedReservationDoc = PlannedReservation & {
    /**
     * Firestore document ID
     */
    id: string;
};

export function isPlannedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is PlannedReservation {
    return reservation.type === ReservationType.PLANNED;
}
