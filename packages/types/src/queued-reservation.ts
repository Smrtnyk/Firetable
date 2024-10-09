import type { PlannedReservation } from "./planned-reservation.js";
import type { WalkInReservation } from "./walk-in-reservation.js";
import { ReservationType } from "./base-reservation.js";

export type QueuedReservationDoc = QueuedReservation & {
    /**
     * The id of the document
     */
    id: string;
};

export type QueuedReservation = Omit<
    PlannedReservation,
    | "arrived"
    | "cancelled"
    | "floorId"
    | "reservationConfirmed"
    | "tableLabel"
    | "type"
    | "waitingForResponse"
> & {
    /**
     * The type of the reservation
     */
    type: ReservationType.QUEUED;
};

export function isQueuedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is QueuedReservation {
    return reservation.type === ReservationType.QUEUED;
}
