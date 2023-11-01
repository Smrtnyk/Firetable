export const ADMIN = "Administrator";

export enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    STAFF = "Staff",
    HOSTESS = "Hostess",
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
    };
}

export type CreateUserPayload = User & {
    password: string;
};
