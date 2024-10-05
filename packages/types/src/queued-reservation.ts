import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { PlannedReservation } from "./planned-reservation.js";

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
    | "waitingForResponse"
> & {
    /**
     * Timestamp when the reservation was moved to the queue or created
     */
    savedAt: number;
};
