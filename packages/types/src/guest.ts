interface PreparedGuestData {
    arrived: boolean;
    cancelled: boolean | undefined;
    contact: string;
    maskedContact: string;
    hashedContact: string;
    guestName: string;
    isVIP: boolean;
}

export type GuestDataPayload = {
    preparedGuestData: PreparedGuestData;
    propertyId: string;
    organisationId: string;
    eventId: string;
    eventName: string;
    eventDate: number;
};

export interface Visit {
    date: number;
    eventName: string;
    arrived: boolean;
    cancelled: boolean;
    isVIPVisit?: boolean;
}

interface VisitedProperties {
    [propertyId: string]: {
        [eventId: string]: Visit | null;
    };
}

export interface GuestDoc {
    id: string;
    name: string;
    contact: string;
    hashedContact: string;
    maskedContact: string;
    visitedProperties: VisitedProperties;
}

export type CreateGuestPayload = Omit<GuestDoc, "id">;
