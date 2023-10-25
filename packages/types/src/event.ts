import type { QueryDocumentSnapshot } from "firebase/firestore";
import { FloorDoc } from "./floor.js";
import { User } from "./auth.js";

export interface CreateEventForm {
    name: string;
    date: string;
    guestListLimit: number;
    img: string;
    entryPrice: number;
}

export type CreateEventPayload = CreateEventForm & {
    propertyId: string;
    floors: FloorDoc[];
};

export interface EventDoc {
    id: string;
    creator: string;
    date: number;
    entryPrice: number;
    img: string | null;
    name: string;
    reservedPercentage: number;
    guestListLimit: number;
    activeStaff: User["id"][];
    propertyId: string;
    info?: string;
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
    groupedWith: string[];
    guestContact?: string;
    guestName: string;
    numberOfGuests: number;
    reservationNote?: string;
    consumption: number;
    reservedBy: Omit<
        User,
        "status" | "floors" | "password" | "username" | "relatedProperties" | "organisationId"
    >;
}

export type CreateReservationPayload = Omit<Reservation, "reservedBy">;
