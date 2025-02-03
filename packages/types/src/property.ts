import type { AspectRatio } from "./organisation.js";

export type CreatePropertyPayload = {
    img: ImageUploadData | string;
    name: string;
    organisationId: string;
};

export interface ImageUploadData {
    dataUrl: string;
    type: string;
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
     * URL to the property's image
     */
    img?: string;
    /**
     * Display name of the property
     */
    name: string;
    /**
     * Reference to the parent organisation's Firestore document ID
     */
    organisationId: string;
    /**
     * Property-specific settings
     */
    settings?: PropertySettings | undefined;
}
/**
 * Property-specific settings stored in Firestore
 */
export interface PropertySettings {
    event?: Partial<{
        /**
         * Aspect ratio for event cards in the UI
         */
        eventCardAspectRatio: AspectRatio;
        /**
         * Default duration for new events in hours
         */
        eventDurationInHours: number;
        /**
         * Default start time for new events in 24h format
         */
        eventStartTime24HFormat: string;
        /**
         * Color codes for different reservation states
         */
        reservationArrivedColor: string;
        reservationCancelledColor: string;
        reservationConfirmedColor: string;
        reservationPendingColor: string;
        reservationWaitingForResponseColor: string;
    }>;

    guest?: Partial<{
        /**
         * Whether to collect the guest information
         */
        collectGuestData: boolean;
        /**
         * Organisation-wide tags that can be applied to guests
         */
        globalGuestTags?: string[];
    }>;

    /**
     * After configured amount of minutes the guest will be marked as late
     * on the floor plan
     * Value is in minutes
     */
    markGuestAsLateAfterMinutes?: number;
    /**
     * IANA timezone identifier for the property location
     * Used for date/time calculations
     */
    timezone?: string;
}

export type UpdatePropertyPayload = CreatePropertyPayload & {
    id: string;
};
