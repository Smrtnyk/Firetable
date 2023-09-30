export const ADMIN = "Administrator";

export enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    WAITER = "Waiter",
    ENTRY = "Entry",
}

export const enum ACTIVITY_STATUS {
    OFFLINE = 0,
    ONLINE = 1,
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role | typeof ADMIN;
    status: ACTIVITY_STATUS;
}

export interface CreateUserPayload {
    user: User & {
        password: string;
    };
    properties: string[];
}
