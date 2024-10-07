import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import type { FloorDoc } from "./floor.js";
import type { ADMIN, Role } from "./auth.js";
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

export interface EventDoc {
    /**
     * id is the same as the document id in firestore
     */
    id: string;
    /**
     * user mail of the event creator
     */
    creator: string;
    /**
     * date as a timestamp of the event
     */
    date: number;
    /**
     * entry price for the event
     * if 0, then the event is free
     */
    entryPrice: number;
    /**
     * name of the event
     */
    name: string;
    /**
     * limit of guests that can be on the guest list
     */
    guestListLimit: number;
    /**
     * id of the property where the event is hosted
     */
    propertyId: string;
    /**
     * id of the organisation where the event is hosted
     */
    organisationId: string;
    /**
     * if provided, any kind of info regarding the event
     * visible to the user
     */
    info?: string;
    /**
     * image url of the event if provided
     */
    img?: string;
    /**
     * document snapshot of the event document
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
    creator: UserIdentifier & { role: Role | typeof ADMIN };
    /**
     * Remove Timestamp after some time has passed
     * due to compat support for old logs
     */
    timestamp: Timestamp | number;
}

export interface EventLogsDoc {
    logs: EventLog[];
}
