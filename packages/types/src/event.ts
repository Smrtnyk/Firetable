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

export type PlannedReservationDoc = PlannedReservation & {
    id: string;
    _doc: QueryDocumentSnapshot<PlannedReservation>;
};

export type WalkInReservationDoc = WalkInReservation & {
    id: string;
    _doc: QueryDocumentSnapshot<WalkInReservation>;
};

export type ReservationDoc = PlannedReservationDoc | WalkInReservationDoc;
export type ReservationDocWithEventId = ReservationDoc & { eventId: string };

type UserIdentifier = Pick<User, "name" | "email" | "id">;

export const enum ReservationStatus {
    DELETED = "Deleted",
    ACTIVE = "Active",
}

export const enum ReservationType {
    WALK_IN = 0,
    PLANNED = 1,
}

interface BaseReservation {
    floorId: string;
    tableLabel: string;
    guestContact?: string;
    numberOfGuests: number;
    reservationNote?: string;
    time: string;
    clearedAt?: Timestamp;
    creator: UserIdentifier & { createdAt: Timestamp };
    status: ReservationStatus;
    isVIP: boolean;
}

export interface WalkInReservation extends BaseReservation {
    type: ReservationType.WALK_IN;
    guestName: string | null;
    consumption: number;
    arrived: true;
}

export interface PlannedReservation extends BaseReservation {
    type: ReservationType.PLANNED;
    reservationConfirmed: boolean;
    cancelled: boolean;
    arrived: boolean;
    consumption: number;
    guestName: string;
    reservedBy: UserIdentifier;
}

export type Reservation = WalkInReservation | PlannedReservation;

export interface EventLog {
    message: string;
    creator: UserIdentifier & { role: Role | typeof ADMIN };
    timestamp: Timestamp;
}

export interface EventLogsDoc {
    logs: EventLog[];
}

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

export interface GuestDoc {
    id: string;
    name: string;
    contact: string;
    visitedProperties: {
        [propertyId: string]: {
            [eventId: string]: Visit | null;
        };
    };
    _doc: QueryDocumentSnapshot<GuestDoc>;
}

export function isAWalkInReservation(
    reservation: PlannedReservation | WalkInReservation,
): reservation is WalkInReservation {
    return reservation.type === ReservationType.WALK_IN;
}

export function isPlannedReservation(
    reservation: PlannedReservation | WalkInReservation,
): reservation is PlannedReservation {
    return reservation.type === ReservationType.PLANNED;
}

export function isActiveReservation(reservation: Reservation): boolean {
    return reservation.status === ReservationStatus.ACTIVE;
}
