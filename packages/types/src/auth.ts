export enum Role {
    ADMIN = "Administrator",
    MANAGER = "Manager",
    WAITER = "Waiter",
    ENTRY = "Entry",
}

export const enum ACTIVITY_STATUS {
    OFFLINE,
    ONLINE,
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role;
    floors: string[];
    status: ACTIVITY_STATUS;
    address?: string;
    mobile?: string;
    region?: string;
}

export type CreateUserPayload = User & {
    password: string;
};
