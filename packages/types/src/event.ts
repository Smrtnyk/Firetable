import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

import type { AppUser } from "./auth.js";
import type { UserIdentifier } from "./base-reservation.js";
import type { FloorDoc } from "./floor.js";

export type CreateEventForm = Pick<
    EventDoc,
    "date" | "entryPrice" | "guestListLimit" | "img" | "name"
>;

export type CreateEventPayload = CreateEventForm & {
    floors: EventFloorDoc[];
    organisationId: string;
    propertyId: string;
};

export interface CreateGuestInGuestListPayload {
    /**
     * whether the guest came and was confirmed
     */
    confirmed: boolean;
    /**
     * timestamp of the confirmed time
     */
    confirmedTime: null | number;
    /**
     * name of the guest
     */
    name: string;
}

export type EditEventPayload = CreateEventForm & {
    organisationId: string;
    propertyId: string;
};

/**
 * Represents an event document in Firestore
 * Contains details about a scheduled event at a property
 */
export interface EventDoc {
    /**
     * Firestore QueryDocumentSnapshot reference
     * Used for real-time updates and pagination
     */
    _doc: QueryDocumentSnapshot<EventDoc>;
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
     * Maximum number of guests allowed on the guest list
     */
    guestListLimit: number;
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * URL to the event's image if set
     */
    img?: string;
    /**
     * Additional public information about the event
     */
    info?: string;
    /**
     * Display name of the event
     */
    name: string;
    /**
     * Reference to the parent organisation's Firestore document ID
     */
    organisationId: string;
    /**
     * Reference to the parent property's Firestore document ID
     */
    propertyId: string;
}

export interface EventFloorDoc extends FloorDoc {
    /**
     * Floors are sortable and this is the order of the floor in the UI
     */
    order?: number;
}

export interface EventLog {
    /**
     * creator of the log
     *
     */
    creator: UserIdentifier & { role: AppUser["role"] };
    /**
     * message of the log
     */
    message: string;
    /**
     * Remove Timestamp after some time has passed
     * due to compat support for old logs
     */
    timestamp: number | Timestamp;
}

export interface EventLogsDoc {
    logs: EventLog[];
}

export type GuestInGuestListData = CreateGuestInGuestListPayload & {
    id: string;
};
