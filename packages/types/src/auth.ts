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
    capabilities: UserCapabilities | undefined;
}

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
}

export const enum UserCapability {
    CAN_RESERVE = "Can reserve",
    CAN_SEE_RESERVATION_CREATOR = "Can see reservation creator",
    CAN_SEE_GUEST_CONTACT = "Can see guest contact",
    CAN_DELETE_RESERVATION = "Can delete reservation",
    CAN_DELETE_OWN_RESERVATION = "Can delete own reservation",
    CAN_CONFIRM_RESERVATION = "Can confirm reservation",
}

export const DEFAULT_CAPABILITIES_BY_ROLE: Record<Role | typeof ADMIN, UserCapabilities> = {
    [ADMIN]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
    },
    [Role.PROPERTY_OWNER]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
    },
    [Role.MANAGER]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
    },
    [Role.HOSTESS]: {
        [UserCapability.CAN_RESERVE]: true,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        [UserCapability.CAN_DELETE_RESERVATION]: true,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: true,
    },
    [Role.STAFF]: {
        [UserCapability.CAN_RESERVE]: false,
        [UserCapability.CAN_SEE_RESERVATION_CREATOR]: false,
        [UserCapability.CAN_SEE_GUEST_CONTACT]: false,
        [UserCapability.CAN_DELETE_RESERVATION]: false,
        [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
        [UserCapability.CAN_CONFIRM_RESERVATION]: false,
    },
};
