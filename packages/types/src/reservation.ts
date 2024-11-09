import type { WalkInReservation, WalkInReservationDoc } from "./walk-in-reservation.js";
import type { PlannedReservation, PlannedReservationDoc } from "./planned-reservation.js";
import { ReservationStatus } from "./base-reservation.js";

/**
 * Union type for all reservation documents in Firestore
 */
export type ReservationDoc = PlannedReservationDoc | WalkInReservationDoc;

/**
 * Reservation document with associated event reference
 */
export type ReservationDocWithEventId = ReservationDoc & {
    /**
     * Reference to the parent event's Firestore document ID
     */
    eventId: string;
};

/**
 * Union type for all reservation types without document IDs
 */
export type Reservation = PlannedReservation | WalkInReservation;

export function isActiveReservation(reservation: Reservation): boolean {
    return reservation.status === ReservationStatus.ACTIVE;
}
