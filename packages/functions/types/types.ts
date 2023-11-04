// Copy, cannot be imported from types package
export const enum Collection {
    EVENTS = "events",
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
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role | typeof ADMIN;
    relatedProperties: string[];
    organisationId: string;
}

export interface EditUserPayload {
    userId: string;
    organisationId: string;
    updatedUser: {
        relatedProperties: string[];
        role: string;
        name: string;
        password?: string;
    };
}

export interface CreateEventForm {
    name: string;
    date: string;
    guestListLimit: number;
    img: string;
    entryPrice: number;
}

export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any>;
    propertyId: string;
}

export type CreateEventPayload = CreateEventForm & {
    propertyId: string;
    organisationId: string;
    id: string;
    floors: FloorDoc[];
};
