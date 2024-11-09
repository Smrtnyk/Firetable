export const enum InventoryItemType {
    DRINK = "drink",
    FOOD = "food",
    OTHER = "other",
}

export const enum DrinkCategory {
    BEER = "beer",
    WINE = "wine",
    SPIRIT = "spirit",
    SOFT_DRINK = "soft_drink",
}

export type CreateInventoryItemPayload = Pick<
    InventoryItemDoc,
    "alcoholContent" | "category" | "name" | "price" | "quantity" | "supplier" | "type" | "volume"
>;

/**
 * Represents an inventory item document in Firestore
 * Used to track stock items like drinks, food, and other supplies
 */
export interface InventoryItemDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Display name of the item
     */
    name: string;
    /**
     * Classification of the item (drink, food, or other)
     */
    type: InventoryItemType;
    /**
     * Specific category for drinks (beer, wine, etc.)
     */
    category?: DrinkCategory;
    /**
     * Price per unit in the default currency
     */
    price: number;
    /**
     * Current quantity in stock
     */
    quantity: number;
    /**
     * Alcohol percentage for alcoholic beverages
     */
    alcoholContent?: number;
    /**
     * Volume in milliliters or liters for liquid items
     */
    volume?: number;
    /**
     * Name or identifier of the supplier
     */
    supplier?: string;
}
