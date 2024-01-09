import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { Reservation } from "./event.js";

export type GuestDataPayload = {
    reservation: Reservation;
    propertyId: string;
    organisationId: string;
    eventId: string;
    eventName: string;
    eventDate: number;
};

export interface Visit {
    date: number;
    eventName: string;
    arrived: boolean;
    cancelled: boolean;
}

interface VisitedProperties {
    [propertyId: string]: {
        [eventId: string]: Visit | null;
    };
}

export interface GuestDoc {
    id: string;
    name: string;
    contact: string;
    visitedProperties: VisitedProperties;
    _doc: QueryDocumentSnapshot<GuestDoc>;
}

export type CreateGuestPayload = Pick<GuestDoc, "name" | "contact" | "visitedProperties">;
