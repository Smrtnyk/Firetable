export type CreateGuestPayload = Omit<GuestDoc, "id">;

export type GuestDataPayload = {
    eventDate: number;
    eventId: string;
    eventName: string;
    organisationId: string;
    preparedGuestData: PreparedGuestData;
    propertyId: string;
};

/**
 * Represents a guest document in Firestore
 * Tracks guest information and their visit history
 */
export interface GuestDoc {
    /**
     * Guest's contact information (usually phone number)
     */
    contact: string;
    /**
     * SHA-256 hashed contact information for privacy
     */
    hashedContact: string;
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Unix timestamp of the last modification
     */
    lastModified?: number;
    /**
     * Partially masked contact information for display
     */
    maskedContact: string;
    /**
     * Guest's full name
     */
    name: string;
    /**
     * Custom tags assigned to the guest
     */
    tags?: string[];
    /**
     * History of properties and events visited by the guest
     */
    visitedProperties: {
        [propertyId: string]: {
            [eventId: string]: null | Visit;
        };
    };
}

/**
 * Represents a single visit record in the guest document
 */
export interface Visit {
    /**
     * Whether the guest physically arrived at the event
     */
    arrived: boolean;
    /**
     * Whether the guest cancelled their reservation
     */
    cancelled: boolean;
    /**
     * Unix timestamp of the event date
     */
    date: number;
    /**
     * Name of the event attended
     */
    eventName: string;
    /**
     * Whether this was a VIP visit
     */
    isVIPVisit?: boolean;
}

interface PreparedGuestData {
    arrived: boolean;
    cancelled: boolean | undefined;
    contact: string;
    guestName: string;
    hashedContact: string;
    isVIP: boolean;
    maskedContact: string;
}
