export interface FloorDoc {
    /**
     * Height of the floor plan in pixels
     */
    height: number;
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Serialized JSON representation of the floor plan layout
     * Contains all elements (tables, sofas, etc.) and their positions
     */
    json: string;
    /**
     * Display name of the floor
     */
    name: string;
    /**
     * Reference to the parent property's Firestore document ID
     */
    propertyId: string;
    /**
     * Width of the floor plan in pixels
     */
    width: number;
}
