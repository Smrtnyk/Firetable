import type { BaseReservation, UserIdentifier } from "./base-reservation.js";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { WalkInReservation } from "./walk-in-reservation.js";
import type { QueuedReservation } from "./queued-reservation.js";
import { ReservationType } from "./base-reservation.js";

export interface PlannedReservation extends BaseReservation {
    type: ReservationType.PLANNED;
    reservationConfirmed: boolean;
    cancelled: boolean;
    arrived: boolean;
    waitingForResponse?: boolean;
    consumption: number;
    guestName: string;
    reservedBy: UserIdentifier;
}

export type PlannedReservationDoc = PlannedReservation & {
    id: string;
    _doc: QueryDocumentSnapshot<PlannedReservation>;
};

export function isPlannedReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is PlannedReservation {
    return reservation.type === ReservationType.PLANNED;
}
