export const enum AdminRole {
    ADMIN = "Administrator",
}

export const enum Role {
    PROPERTY_OWNER = "Property Owner",
    MANAGER = "Manager",
    STAFF = "Staff",
    HOSTESS = "Hostess",
}

export type AdminUser = Omit<User, "role"> & { role: AdminRole.ADMIN };

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role;
    relatedProperties: string[];
    organisationId: string;
    capabilities: UserCapabilities | undefined;
}

export type AppUser = AdminUser | User;

export interface EditUserPayload {
    userId: string;
    organisationId: string;
    updatedUser: CreateUserPayload;
}

export type CreateUserPayload = User & {
    password: string;
    capabilities: UserCapabilities | undefined;
};

export interface UserCapabilities {
    [UserCapability.CAN_RESERVE]?: boolean;
    [UserCapability.CAN_SEE_RESERVATION_CREATOR]?: boolean;
    [UserCapability.CAN_SEE_GUEST_CONTACT]?: boolean;
    [UserCapability.CAN_DELETE_RESERVATION]?: boolean;
    [UserCapability.CAN_DELETE_OWN_RESERVATION]?: boolean;
    [UserCapability.CAN_CONFIRM_RESERVATION]?: boolean;
    [UserCapability.CAN_CANCEL_RESERVATION]?: boolean;
    [UserCapability.CAN_EDIT_RESERVATION]?: boolean;
    [UserCapability.CAN_EDIT_OWN_RESERVATION]?: boolean;
    [UserCapability.CAN_SEE_INVENTORY]?: boolean;
    [UserCapability.CAN_EDIT_FLOOR_PLANS]?: boolean;
    [UserCapability.CAN_CREATE_EVENTS]?: boolean;
    [UserCapability.CAN_SEE_GUESTBOOK]?: boolean;
}

export const enum UserCapability {
    CAN_RESERVE = "Can reserve",
    CAN_SEE_RESERVATION_CREATOR = "Can see reservation creator",
    CAN_SEE_GUEST_CONTACT = "Can see guest contact",
    CAN_DELETE_RESERVATION = "Can delete reservation",
    CAN_DELETE_OWN_RESERVATION = "Can delete own reservation",
    CAN_CONFIRM_RESERVATION = "Can confirm reservation",
    CAN_CANCEL_RESERVATION = "Can cancel reservation",
    CAN_EDIT_RESERVATION = "Can edit reservation",
    CAN_EDIT_OWN_RESERVATION = "Can edit own reservation",
    CAN_SEE_INVENTORY = "Can see inventory",
    CAN_EDIT_FLOOR_PLANS = "Can edit floor plans",
    CAN_CREATE_EVENTS = "Can create events",
    CAN_SEE_GUESTBOOK = "Can see guestbook",
}

export const DEFAULT_CAPABILITIES_BY_ROLE: Record<AdminRole.ADMIN | Role, UserCapabilities> = {
    [AdminRole.ADMIN]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
    },
    [Role.PROPERTY_OWNER]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
    },
    [Role.MANAGER]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CANCEL_RESERVATION]: true,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_SEE_INVENTORY]: true,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
        [UserCapability.CAN_CREATE_EVENTS]: true,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
    },
    [Role.HOSTESS]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
        [UserCapability.CAN_CANCEL_RESERVATION]: false,
        [UserCapability.CAN_EDIT_RESERVATION]: true,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_SEE_INVENTORY]: false,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
        [UserCapability.CAN_CREATE_EVENTS]: false,
        [UserCapability.CAN_SEE_GUESTBOOK]: true,
    },
    [Role.STAFF]: {
        [UserCapability.CAN_RESERVE]: false,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: false,
        [UserCapability.CAN_DELETE_RESERVATION]: false,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: false,
        [UserCapability.CAN_CANCEL_RESERVATION]: false,
        [UserCapability.CAN_EDIT_RESERVATION]: false,
        [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
        [UserCapability.CAN_SEE_INVENTORY]: false,
        [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
        [UserCapability.CAN_CREATE_EVENTS]: false,
        [UserCapability.CAN_SEE_GUESTBOOK]: false,
    },
};
