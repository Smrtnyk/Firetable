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

/**
 * Represents a guest document in Firestore
 * Tracks guest information and their visit history
 */
export interface GuestDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Guest's full name
     */
    name: string;
    /**
     * Guest's contact information (usually phone number)
     */
    contact: string;
    /**
     * SHA-256 hashed contact information for privacy
     */
    hashedContact: string;
    /**
     * Partially masked contact information for display
     */
    maskedContact: string;
    /**
     * Unix timestamp of the last modification
     */
    lastModified?: number;
    /**
     * Custom tags assigned to the guest
     */
    tags?: string[];
    /**
     * History of properties and events visited by the guest
     */
    visitedProperties: {
        [propertyId: string]: {
            [eventId: string]: Visit | null;
        };
    };
}

/**
 * Represents a single visit record in the guest document
 */
export interface Visit {
    /**
     * Unix timestamp of the event date
     */
    date: number;
    /**
     * Name of the event attended
     */
    eventName: string;
    /**
     * Whether the guest physically arrived at the event
     */
    arrived: boolean;
    /**
     * Whether the guest cancelled their reservation
     */
    cancelled: boolean;
    /**
     * Whether this was a VIP visit
     */
    isVIPVisit?: boolean;
}

export type CreateGuestPayload = Omit<GuestDoc, "id">;
