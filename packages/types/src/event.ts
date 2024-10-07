import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import type { FloorDoc } from "./floor.js";
import type { ADMIN, Role } from "./auth.js";
import type { UserIdentifier } from "./base-reservation.js";

export interface CreateEventForm {
    name: string;
    date: number;
    guestListLimit: number;
    entryPrice: number;
    img?: string;
}

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
    id: string;
    creator: string;
    date: number;
    entryPrice: number;
    name: string;
    guestListLimit: number;
    propertyId: string;
    organisationId: string;
    info?: string;
    img?: string;
    _doc: QueryDocumentSnapshot<EventDoc>;
}

export interface CreateGuestInGuestListPayload {
    name: string;
    confirmedTime: number | null;
    confirmed: boolean;
}

export type GuestInGuestListData = CreateGuestInGuestListPayload & {
    id: string;
};

export interface EventLog {
    message: string;
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
