import type { WalkInReservation, WalkInReservationDoc } from "./walk-in-reservation.js";
import type { PlannedReservation, PlannedReservationDoc } from "./planned-reservation.js";
import { ReservationStatus } from "./base-reservation.js";

export type ReservationDoc = PlannedReservationDoc | WalkInReservationDoc;
export type ReservationDocWithEventId = ReservationDoc & { eventId: string };
export type Reservation = PlannedReservation | WalkInReservation;

export function isActiveReservation(reservation: Reservation): boolean {
    return reservation.status === ReservationStatus.ACTIVE;
}
