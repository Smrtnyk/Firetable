export interface UpdatedTablesDifference {
    added: BaseTable[];
    removed: BaseTable[];
    updated: BaseTable[];
}

export const enum ChangeType {
    DELETE = "delete",
    ADD = "add"
}

export interface PushSubscriptionDoc {
    id: string;
    endpoint: string;
    expirationTime: null | Date;
    keys: {
        auth: string;
        p256dh: string;
    };
}

// Copy, cannot be imported from types package
export const enum Collection {
    EVENTS = "events",
    GUEST_LIST = "guestList",
    USERS = "users",
    FLOORS = "floors",
    FCM = "fcm",
    EVENT_FEED = "eventFeed",
    SETTINGS = "settings",
    PROPERTIES = "properties",
    USER_PROPERTY_MAP = "userPropertyMap",
}

// Copy, cannot be imported from types package
export enum Role {
    ADMIN = "Administrator",
    MANAGER = "Manager",
    WAITER = "Waiter",
    ENTRY = "Entry",
}

// Copy, cannot be imported from types package
export const enum ACTIVITY_STATUS {
    OFFLINE = 0,
    ONLINE = 1,
}

// Cannot import this because functions deploy
export interface BaseTable {
    reservation: Record<string, any>;
    label: string;
}

// Cannot import this because functions deploy
export interface CreateUserPayload {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role;
    status: ACTIVITY_STATUS;
    password: string;
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
}

export type CreateEventPayload = CreateEventForm & {
    id: string;
    floors: FloorDoc[];
};
