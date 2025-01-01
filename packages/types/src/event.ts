import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { FloorDoc } from "./floor.js";

export type CreateEventForm = Pick<
    EventDoc,
    "date" | "entryPrice" | "guestListLimit" | "img" | "name"
>;

export type CreateEventPayload = CreateEventForm & {
    propertyId: string;
    organisationId: string;
    floors: EventFloorDoc[];
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

export interface EventFloorDoc extends FloorDoc {
    /**
     * Floors are sortable and this is the order of the floor in the UI
     */
    order?: number;
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
