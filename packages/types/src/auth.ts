export const SUPER_ADMIN = "Super Administrator";

export enum Role {
    ADMIN = "Administrator",
    MANAGER = "Manager",
    WAITER = "Waiter",
    ENTRY = "Entry",
}

export const enum ACTIVITY_STATUS {
    OFFLINE = 0,
    ONLINE = 1,
}

export type UserClubs = {
    id: string;
    name: string;
};

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    clubs: UserClubs[];
    role: Role;
    status: ACTIVITY_STATUS;
}

export type CreateUserPayload = User & {
    password: string;
};
