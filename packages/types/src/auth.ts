export const ADMIN = "Administrator";

export enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    STAFF = "Staff",
    HOSTESS = "Hostess",
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
    relatedProperties: string[];
    organisationId: string;
}

export interface EditUserPayload {
    userId: string;
    updatedUser: {
        relatedProperties: string[];
        role: string;
        name: string;
    };
}

export type CreateUserPayload = User & {
    password: string;
};
