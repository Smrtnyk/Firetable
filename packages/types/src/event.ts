import { QueryDocumentSnapshot } from "@firebase/firestore";
import { FloorDoc } from "./floor";
import { User } from "./auth";

export interface CreateEventForm {
    name: string;
    date: string;
    guestListLimit: number;
    img: string;
    entryPrice: number;
}

export type CreateEventPayload = CreateEventForm & {
    id: string;
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
    info?: string;
    _doc: QueryDocumentSnapshot<EventDoc>;
}

export interface EventFeedDoc {
    body: string;
    timestamp: number;
    type: "Reservation";
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
    reservedBy: Omit<User, "status" | "floors" | "password" | "username">;
}

export type CreateReservationPayload = Omit<Reservation, "reservedBy">;
