import type { QueryDocumentSnapshot } from "firebase/firestore";
import { FloorDoc } from "./floor.js";
import { User } from "./auth.js";

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

export interface Reservation {
    confirmed: boolean;
    guestContact?: string;
    guestName: string;
    numberOfGuests: number;
    reservationNote?: string;
    consumption: number;
    time: string;
    reservedBy: Pick<User, "name" | "email">;
    creator?: Pick<User, "name" | "email" | "id">;
}
