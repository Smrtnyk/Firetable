export const enum AdminRole {
    ADMIN = "Administrator",
}

export const enum Role {
    HOSTESS = "Hostess",
    MANAGER = "Manager",
    PROPERTY_OWNER = "Property Owner",
    STAFF = "Staff",
}

export const enum UserCapability {
    CAN_CANCEL_RESERVATION = "Can cancel reservation",
    CAN_CONFIRM_RESERVATION = "Can confirm reservation",
    CAN_CREATE_EVENTS = "Can create events",
    CAN_DELETE_OWN_RESERVATION = "Can delete own reservation",
    CAN_DELETE_RESERVATION = "Can delete reservation",
    CAN_EDIT_FLOOR_PLANS = "Can edit floor plans",
    CAN_EDIT_OWN_RESERVATION = "Can edit own reservation",
    CAN_EDIT_RESERVATION = "Can edit reservation",
    CAN_RESERVE = "Can reserve",
    CAN_SEE_DIGITAL_DRINK_CARDS = "Can see digital drink cards",
    CAN_SEE_GUEST_CONTACT = "Can see guest contact",
    CAN_SEE_GUESTBOOK = "Can see guestbook",
    CAN_SEE_INVENTORY = "Can see inventory",
    CAN_SEE_RESERVATION_CREATOR = "Can see reservation creator",
}

export type AdminUser = Omit<User, "role"> & { role: AdminRole.ADMIN };

export type AppUser = AdminUser | User;

export type CreateUserPayload = User & {
    capabilities: undefined | UserCapabilities;
    password: string;
};

export interface EditUserPayload {
    organisationId: string;
    updatedUser: CreateUserPayload;
    userId: string;
}

export interface User {
    capabilities: undefined | UserCapabilities;
    email: string;
    id: string;
    lastSignInTime?: null | number;
    name: string;
    organisationId: string;
    relatedProperties: string[];
    role: Role;
    username: string;
}

export interface UserCapabilities {
    [UserCapability.CAN_CANCEL_RESERVATION]?: boolean;
    [UserCapability.CAN_CONFIRM_RESERVATION]?: boolean;
    [UserCapability.CAN_CREATE_EVENTS]?: boolean;
    [UserCapability.CAN_DELETE_OWN_RESERVATION]?: boolean;
    [UserCapability.CAN_DELETE_RESERVATION]?: boolean;
    [UserCapability.CAN_EDIT_FLOOR_PLANS]?: boolean;
    [UserCapability.CAN_EDIT_OWN_RESERVATION]?: boolean;
    [UserCapability.CAN_EDIT_RESERVATION]?: boolean;
    [UserCapability.CAN_RESERVE]?: boolean;
    [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]?: boolean;
    [UserCapability.CAN_SEE_GUEST_CONTACT]?: boolean;
    [UserCapability.CAN_SEE_GUESTBOOK]?: boolean;
    [UserCapability.CAN_SEE_INVENTORY]?: boolean;
    [UserCapability.CAN_SEE_RESERVATION_CREATOR]?: boolean;
}

export const DEFAULT_CAPABILITIES_BY_ROLE: Record<AdminRole.ADMIN | Role, UserCapabilities> = {
    [AdminRole.ADMIN]: {
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
    },
    [Role.HOSTESS]: {
        [UserCapability.CAN_CANCEL_RESERVATION]: false,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CREATE_EVENTS]: false,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
        [UserCapability.CAN_SEE_INVENTORY]: false,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
    },
    [Role.MANAGER]: {
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
    },
    [Role.PROPERTY_OWNER]: {
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
    },
    [Role.STAFF]: {
        [UserCapability.CAN_CANCEL_RESERVATION]: false,
        [UserCapability.CAN_CONFIRM_RESERVATION]: false,
        [UserCapability.CAN_CREATE_EVENTS]: false,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: false,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: false,
        [UserCapability.CAN_RESERVE]: false,
        [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: false,
        [UserCapability.CAN_SEE_GUESTBOOK]: false,
        [UserCapability.CAN_SEE_INVENTORY]: false,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
    },
};
