export interface FloorDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Display name of the floor
     */
    name: string;
    /**
     * Width of the floor plan in pixels
     */
    width: number;
    /**
     * Height of the floor plan in pixels
     */
    height: number;
    /**
     * Serialized JSON representation of the floor plan layout
     * Contains all elements (tables, sofas, etc.) and their positions
     */
    json: string;
    /**
     * Reference to the parent property's Firestore document ID
     */
    propertyId: string;
}
