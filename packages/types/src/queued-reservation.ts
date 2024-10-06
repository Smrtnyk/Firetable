import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { PlannedReservation } from "./planned-reservation.js";
import type { WalkInReservation } from "./walk-in-reservation.js";
import { ReservationType } from "./base-reservation.js";

export type QueuedReservationDoc = QueuedReservation & {
    /**
     * The id of the document
     */
    id: number;

    /**
     * document snapshot provided by the vuefire
     */
    _doc: QueryDocumentSnapshot<QueuedReservationDoc>;
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
    /**
     * Timestamp when the reservation was moved to the queue or created
     */
    savedAt: number;
};

export function isQueuedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is QueuedReservation {
    return reservation.type === ReservationType.QUEUED;
}
