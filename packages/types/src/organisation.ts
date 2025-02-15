export const enum OrganisationStatus {
    ACTIVE = "active",
    DISABLED = "disabled",
    PENDING = "pending",
    SUSPENDED = "suspended",
}

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
     * Maximum number of properties this organisation can create
     */
    maxAllowedProperties: number;
    /**
     * Display name of the organisation
     */
    name: string;

    /**
     * Organisation-wide settings
     */
    settings?: OrganisationSettings | undefined;
    /**
     * Status of the organisation
     */
    status?: OrganisationStatus;
    /**
     * Subscription settings
     * These settings are used to enforce subscription limits and are not configurable by the user
     * They are set by the backend based on the subscription plan the organisation is on (TBD)
     */
    subscriptionSettings?: SubscriptionSettings;
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
}

export interface SubscriptionSettings {
    /**
     * Maximum number of floor plans that can be set per event
     */
    maxFloorPlansPerEvent: number;
}
