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
    /**
     * Timestamp of the visit, which is event date
     */
    date: number;
    /**
     * Name of the event
     */
    eventName: string;
    /**
     * If the guest arrived at the event
     */
    arrived: boolean;
    /**
     * If the guest cancelled the visit
     */
    cancelled: boolean;
    /**
     * If the guest visit was a VIP
     */
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
    lastModified?: number;
    visitedProperties: VisitedProperties;
}

export type CreateGuestPayload = Omit<GuestDoc, "id">;
