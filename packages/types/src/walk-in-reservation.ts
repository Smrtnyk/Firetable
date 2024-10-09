import type { BaseReservation } from "./base-reservation.js";
import type { PlannedReservation } from "./planned-reservation.js";
import type { QueuedReservation } from "./queued-reservation.js";
import { ReservationType } from "./base-reservation.js";

export interface WalkInReservation extends BaseReservation {
    type: ReservationType.WALK_IN;
    guestName: string;
    consumption: number;
    arrived: true;
}

export type WalkInReservationDoc = WalkInReservation & {
    id: string;
};

export function isAWalkInReservation(
    reservation: PlannedReservation | QueuedReservation | WalkInReservation,
): reservation is WalkInReservation {
    return reservation.type === ReservationType.WALK_IN;
}
