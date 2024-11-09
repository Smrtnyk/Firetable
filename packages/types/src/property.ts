/**
 * Property-specific settings stored in Firestore
 */
export interface PropertySettings {
    /**
     * IANA timezone identifier for the property location
     * Used for date/time calculations
     */
    timezone: string;
}

/**
 * Represents a property document in Firestore
 * A property is a venue or location that can host events
 */
export interface PropertyDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Display name of the property
     */
    name: string;
    /**
     * Reference to the parent organisation's Firestore document ID
     */
    organisationId: string;
    /**
     * URL to the property's image
     */
    img?: string;
    /**
     * Property-specific settings
     */
    settings?: PropertySettings | undefined;
}
