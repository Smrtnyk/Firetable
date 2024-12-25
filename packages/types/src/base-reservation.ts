import type { Timestamp } from "firebase/firestore";
import type { User } from "./auth.js";

export enum ReservationState {
    PENDING = "PENDING",
    WAITING_FOR_RESPONSE = "WAITING_FOR_RESPONSE",
    CONFIRMED = "CONFIRMED",
    ARRIVED = "ARRIVED",
}

/**
 * Enum for different types of reservations
 */
export const enum ReservationType {
    /**
     * Guest arrived without prior reservation
     */
    WALK_IN = 0,
    /**
     * Guest made a reservation in advance
     */
    PLANNED = 1,
    /**
     * Guest is on waiting list
     */
    QUEUED = 2,
}

/**
 * Enum for reservation status in Firestore
 */
export const enum ReservationStatus {
    /**
     * Soft-deleted reservation
     * Kept for analytics purposes
     */
    DELETED = "Deleted",
    /**
     * Active reservation
     */
    ACTIVE = "Active",
}

/**
 * Basic user information needed for identification
 */
export type UserIdentifier = Pick<User, "email" | "id" | "name">;

/**
 * Base interface for all reservation types in Firestore
 * Contains common fields shared across reservation types
 */
export interface BaseReservation {
    /**
     * Reference to the Firestore document ID of the floor
     */
    floorId: string;
    /**
     * Table identifier(s) for the reservation
     * Can be a single table or multiple linked tables
     */
    tableLabel: string[] | string;
    /**
     * Guest's contact information (usually phone number)
     * Optional for privacy reasons
     */
    guestContact?: string;
    /**
     * Number of guests in the party
     */
    numberOfGuests: number;
    /**
     * Special requests or notes for the reservation
     */
    reservationNote?: string;
    /**
     * Reservation time in 24-hour format (HH:mm)
     */
    time: string;
    /**
     * Unix timestamp when the reservation was cleared/completed
     * @deprecated Remove Timestamp type after migration period
     */
    clearedAt?: Timestamp | number;
    /**
     * Information about who created the reservation and when
     */
    creator: UserIdentifier & {
        createdAt: Timestamp | number;
    };
    /**
     * The status of the reservation
     * Either active or deleted
     * Default is active, but if the reservation is deleted, it means
     * it is treated as soft delete, for later inclusion in the logs and analytics
     */
    status: ReservationStatus;

    /**
     * The state of the reservation
     */
    state: ReservationState;

    /**
     * Indicates if this is a VIP reservation
     */
    isVIP: boolean;
}
