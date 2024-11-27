export interface ImageUploadData {
    dataUrl: string;
    type: string;
}

export type CreatePropertyPayload = {
    name: string;
    organisationId: string;
    img: ImageUploadData | string;
};

export type UpdatePropertyPayload = CreatePropertyPayload & {
    id: string;
};
/**
 * Property-specific settings stored in Firestore
 */
export interface PropertySettings {
    /**
     * IANA timezone identifier for the property location
     * Used for date/time calculations
     */
    timezone: string;

    /**
     * After configured amount of minutes the guest will be marked as late
     * on the floor plan
     * Value is in minutes
     */
    markGuestAsLateAfterMinutes: number;
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
