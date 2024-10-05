import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { BaseReservation } from "./base-reservation.js";
import type { PlannedReservation } from "./planned-reservation.js";
import { ReservationType } from "./base-reservation.js";

export interface WalkInReservation extends BaseReservation {
    type: ReservationType.WALK_IN;
    guestName: string;
    consumption: number;
    arrived: true;
}

export type WalkInReservationDoc = WalkInReservation & {
    id: string;
    _doc: QueryDocumentSnapshot<WalkInReservation>;
};

export function isAWalkInReservation(
    reservation: PlannedReservation | WalkInReservation,
): reservation is WalkInReservation {
    return reservation.type === ReservationType.WALK_IN;
}
