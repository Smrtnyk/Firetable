// Copy, cannot be imported from types package
export const enum Collection {
    EVENTS = "events",
    EVENT_LOGS = "eventLogs",
    RESERVATIONS = "reservations",
    GUESTS = "guests",
    GUEST_LIST = "guestList",
    USERS = "users",
    FLOORS = "floors",
    ORGANISATIONS = "organisations",
    PROPERTIES = "properties",
}

export const ADMIN = "Administrator";
// Copy, cannot be imported from types package
export enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    STAFF = "Staff",
    HOSTESS = "Hostess",
}

// Cannot import this because functions deploy
export interface CreateUserPayload {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role;
    password: string;
    relatedProperties: string[];
    organisationId: string;
    capabilities: UserCapabilities;
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role | typeof ADMIN;
    relatedProperties: string[];
    organisationId: string;
    capabilities: UserCapabilities;
}

export interface EditUserPayload {
    userId: string;
    organisationId: string;
    updatedUser: CreateUserPayload;
}

interface UserCapabilities {
    [USER_CAPABILITIES.CAN_RESERVE]: boolean;
}

export const enum USER_CAPABILITIES {
    CAN_RESERVE = "can-reserve",
}

interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any>;
    propertyId: string;
}

interface CreateEventForm {
    name: string;
    date: number;
    guestListLimit: number;
    img: string;
    entryPrice: number;
}

export type CreateEventPayload = CreateEventForm & {
    propertyId: string;
    organisationId: string;
    id: string;
    floors: FloorDoc[];
};

export interface SimpleReservation {
    floorId: string;
    tableLabel: string;
    arrived: boolean;
    reservationConfirmed: boolean | undefined;
    cancelled: boolean | undefined;
    guestContact?: string;
    guestName: string;
    numberOfGuests: number | string;
    consumption: number;
    time: string;
}

export interface Visit {
    date: number;
    eventName: string;
    arrived: boolean;
    cancelled: boolean;
}

export interface GuestDoc {
    name: string;
    contact: string;
    visitedProperties: {
        [propertyId: string]: {
            [eventId: string]: Visit | null;
        };
    };
}
