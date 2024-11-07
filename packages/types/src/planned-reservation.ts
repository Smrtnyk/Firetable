import type { BaseReservation, UserIdentifier } from "./base-reservation.js";
import type { WalkInReservation } from "./walk-in-reservation.js";
import type { QueuedReservation } from "./queued-reservation.js";
import { ReservationType } from "./base-reservation.js";

export interface PlannedReservation extends BaseReservation {
    /**
     * The type of reservation.
     */
    type: ReservationType.PLANNED;
    /**
     * If the reservation has been confirmed by the guest
     */
    reservationConfirmed: boolean;
    /**
     * If the reservation has been cancelled
     */
    cancelled: boolean;
    /**
     * If the guest has physically arrived
     */
    arrived: boolean;
    /**
     * If the reservation is waiting for a response from the guest
     */
    waitingForResponse?: boolean;
    /**
     * The minimum consumption required for the reservation
     */
    consumption: number;
    /**
     * The name of the guest
     */
    guestName: string;
    /**
     * The contact information of the guest
     */
    reservedBy: UserIdentifier;
}

export type PlannedReservationDoc = PlannedReservation & {
    id: string;
};

export function isPlannedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is PlannedReservation {
    return reservation.type === ReservationType.PLANNED;
}
