export type AspectRatio = "1" | "16:9";

/**
 * Represents an organisation document in Firestore
 * An organisation is the top-level entity that owns properties
 */
export interface OrganisationDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Display name of the organisation
     */
    name: string;
    /**
     * Maximum number of properties this organisation can create
     */
    maxAllowedProperties: number;
    /**
     * Organisation-wide settings
     */
    settings?: OrganisationSettings | undefined;
}

/**
 * Configuration settings stored in the organisation document
 */
export interface OrganisationSettings {
    property: {
        /**
         * Aspect ratio for property cards in the UI
         */
        propertyCardAspectRatio: AspectRatio;
    };
    event: {
        /**
         * Aspect ratio for event cards in the UI
         */
        eventCardAspectRatio: AspectRatio;
        /**
         * Default start time for new events in 24h format
         */
        eventStartTime24HFormat: string;
        /**
         * Default duration for new events in hours
         */
        eventDurationInHours: number;
        /**
         * Color codes for different reservation states
         */
        reservationArrivedColor: string;
        reservationConfirmedColor: string;
        reservationCancelledColor: string;
        reservationPendingColor: string;
        reservationWaitingForResponseColor: string;
    };
    guest: {
        /**
         * Whether to collect the guest information
         */
        collectGuestData: boolean;
        /**
         * Organisation-wide tags that can be applied to guests
         */
        globalGuestTags?: string[];
    };
}
