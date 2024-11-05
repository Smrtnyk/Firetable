import type { Timestamp } from "firebase/firestore";
import type { User } from "./auth.js";

export const enum ReservationType {
    WALK_IN = 0,
    PLANNED = 1,
    QUEUED = 2,
}

export const enum ReservationStatus {
    DELETED = "Deleted",
    ACTIVE = "Active",
}

export type UserIdentifier = Pick<User, "email" | "id" | "name">;

export interface BaseReservation {
    /**
     * The id of the floor where the table is located
     */
    floorId: string;
    /**
     * The id of the table where the reservation is located
     */
    tableLabel: string[] | string;
    /**
     * Optional telephone number of the guest
     */
    guestContact?: string;
    /**
     * The number of guests in the reservation
     */
    numberOfGuests: number;
    /**
     * Reservation note in case the guest has any special requests
     */
    reservationNote?: string;
    /**
     * The time the reservation was created
     * In string format of HH:mm
     */
    time: string;
    /**
     * The time the reservation was last cleared
     * Remove Timestamp after some time has passed
     * due to compat support for old reservations
     */
    clearedAt?: Timestamp | number;
    /**
     * Identifier of the user who created the reservation
     */
    creator: UserIdentifier & { createdAt: Timestamp | number };
    /**
     * The status of the reservation
     * Either active or deleted
     * Default is active, but if the reservation is deleted, it means
     * it is treated as soft delete, for later inclusion in the logs and analytics
     */
    status: ReservationStatus;
    /**
     * If the guest is a VIP
     */
    isVIP: boolean;
}
