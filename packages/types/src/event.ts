import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import type { FloorDoc } from "./floor.js";
import type { AppUser } from "./auth.js";
import type { UserIdentifier } from "./base-reservation.js";

export type CreateEventForm = Pick<
    EventDoc,
    "date" | "entryPrice" | "guestListLimit" | "img" | "name"
>;

export type CreateEventPayload = CreateEventForm & {
    propertyId: string;
    organisationId: string;
    floors: FloorDoc[];
};

export type EditEventPayload = CreateEventForm & {
    propertyId: string;
    organisationId: string;
};

/**
 * Represents an event document in Firestore
 * Contains details about a scheduled event at a property
 */
export interface EventDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Firebase Auth email of the event creator
     */
    creator: string;
    /**
     * Unix timestamp of the event date
     */
    date: number;
    /**
     * Entry price in default currency
     * Zero indicates a free event
     */
    entryPrice: number;
    /**
     * Display name of the event
     */
    name: string;
    /**
     * Maximum number of guests allowed on the guest list
     */
    guestListLimit: number;
    /**
     * Reference to the parent property's Firestore document ID
     */
    propertyId: string;
    /**
     * Reference to the parent organisation's Firestore document ID
     */
    organisationId: string;
    /**
     * Additional public information about the event
     */
    info?: string;
    /**
     * URL to the event's image if set
     */
    img?: string;
    /**
     * Firestore QueryDocumentSnapshot reference
     * Used for real-time updates and pagination
     */
    _doc: QueryDocumentSnapshot<EventDoc>;
}

export interface CreateGuestInGuestListPayload {
    /**
     * name of the guest
     */
    name: string;
    /**
     * timestamp of the confirmed time
     */
    confirmedTime: number | null;
    /**
     * whether the guest came and was confirmed
     */
    confirmed: boolean;
}

export type GuestInGuestListData = CreateGuestInGuestListPayload & {
    id: string;
};

export interface EventLog {
    /**
     * message of the log
     */
    message: string;
    /**
     * creator of the log
     *
     */
    creator: UserIdentifier & { role: AppUser["role"] };
    /**
     * Remove Timestamp after some time has passed
     * due to compat support for old logs
     */
    timestamp: Timestamp | number;
}

export interface EventLogsDoc {
    logs: EventLog[];
}
