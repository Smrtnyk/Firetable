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

export interface InventoryItemDoc {
    // Unique identifier (can be the document ID)
    id: string;
    // Name of the item
    name: string;
    // Type of item
    type: InventoryItemType;
    // e.g., 'beer', 'wine', 'snack' (optional)
    category?: DrinkCategory;
    // Price per unit
    price: number;
    // Quantity in stock
    quantity: number;
    // Alcohol percentage (if applicable)
    alcoholContent?: number;
    // Volume in ml or l (if applicable)
    volume?: number;
    // Supplier name or ID (optional)
    supplier?: string;
}
