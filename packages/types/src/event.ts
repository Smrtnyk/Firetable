import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import type { FloorDoc } from "./floor.js";
import type { ADMIN, Role, User } from "./auth.js";

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

export interface CreateGuestPayload {
    name: string;
    confirmedTime: number | null;
    confirmed: boolean;
}

export type GuestData = CreateGuestPayload & {
    id: string;
};

export type ReservationDoc = Reservation & {
    id: string;
    _doc: QueryDocumentSnapshot<Reservation>;
};

type UserIdentifier = Pick<User, "name" | "email" | "id">;

export const enum ReservationStatus {
    DELETED = "Deleted",
    ACTIVE = "Active",
}

export interface Reservation {
    floorId: string;
    tableLabel: string;
    confirmed: boolean;
    reservationConfirmed: boolean | undefined;
    cancelled: boolean | undefined;
    guestContact?: string;
    guestName: string;
    numberOfGuests: number | string;
    reservationNote?: string;
    consumption: number;
    time: string;
    reservedBy: UserIdentifier;
    creator: UserIdentifier & { createdAt: Timestamp };
    status: ReservationStatus | undefined;
}

export interface EventLog {
    message: string;
    creator: UserIdentifier & { role: Role | typeof ADMIN };
    timestamp: Timestamp;
}

export interface EventLogsDoc {
    logs: EventLog[];
}
