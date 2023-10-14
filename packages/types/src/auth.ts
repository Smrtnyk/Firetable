export const ADMIN = "Administrator";

export enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    STAFF = "Staff",
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

export interface EditUserPayload {
    properties: string[];
    userId: string;
    updatedUser: {
        role: string;
        name: string;
    };
}

export interface CreateUserPayload {
    user: User & {
        password: string;
    };
    properties: string[];
}
