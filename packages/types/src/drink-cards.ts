import type { DrinkItem, InventoryItemDoc, InventoryItemType } from "./inventory.js";

export type CreateCustomDrinkCardPayload = Omit<
    CustomDrinkCardDoc,
    "createdAt" | "id" | "updatedAt"
>;

export type CreateDrinkCardPayload = CreateCustomDrinkCardPayload | CreatePDFDrinkCardPayload;

export type CreatePDFDrinkCardPayload = Omit<PDFDrinkCardDoc, "createdAt" | "id" | "updatedAt">;

export interface CustomDrinkCardDoc extends DrinkCardBase {
    backgroundImage?: string;
    createdAt: Date;
    elements: DrinkCardElement[];
    id: string;
    pdfUrl?: never;
    showItemDescription: boolean;
    showLogo: boolean;
    type: "custom";
    updatedAt: Date;
}

export interface DrinkBundle extends DrinkCardElement {
    description?: string;
    isHighlighted?: boolean;
    isVisible: boolean;
    items: {
        // Reference to existing menu items
        inventoryItemId: string;
        quantity: number;
    }[];
    price: number;
    savings?: {
        amount: number;
        percentage: number;
    };
    type: "bundle";
}
export type DrinkCardDoc = CustomDrinkCardDoc | PDFDrinkCardDoc;
export interface DrinkCardElement {
    id: string;
    name: string;
    type: "bundle" | "header" | "header-end" | "section";
}

export interface DrinkCardHeader extends DrinkCardElement {
    name: "";
    type: "header";
}

export interface DrinkCardHeaderEnd extends DrinkCardElement {
    type: "header-end";
}

export interface DrinkCardItem {
    alcoholContent?: InventoryItemDoc extends DrinkItem
        ? InventoryItemDoc["alcoholContent"]
        : never;
    brand?: InventoryItemDoc["brand"];
    /**
     *  Additional note specific to this menu item
     */
    customNote?: string;

    description?: InventoryItemDoc["description"];
    /**
     *  Whether to show alcohol content
     */
    displayAlcoholContent?: boolean;
    /**
     * Whether to show region/origin
     */
    displayOrigin?: boolean;
    inventoryItemId: string;
    // Optional display fields
    /**
     * Featuring special items
     */
    isHighlighted?: boolean;
    isVisible: boolean;
    mainCategory: InventoryItemDoc["mainCategory"];
    // Fields copied from inventory
    name: string;
    order: number;
    price: number;
    region?: InventoryItemDoc["region"];
    servingSize: ServingSize;
    /**
     * Special reduced price (e.g. Happy Hour)
     */
    specialPrice: SpecialPrice;

    style?: InventoryItemDoc["style"];
    subCategory: InventoryItemDoc["subCategory"];
    /**
     * Tags for special labels
     */
    tags?: string[];
    type: InventoryItemType;
    volume?: InventoryItemDoc["volume"];
}

export interface DrinkCardSection extends DrinkCardElement {
    items: DrinkCardItem[];
    template: SectionTemplateId;
    type: "section";
}

export interface PDFDrinkCardDoc extends DrinkCardBase {
    createdAt: Date;
    elements?: never;
    id: string;
    pdfUrl?: string;
    type: "pdf";
    updatedAt: Date;
}

export type SectionTemplateId =
    | "beer"
    | "bottles"
    | "cocktails"
    | "custom"
    | "shots"
    | "soft-drinks"
    | "spirits"
    | "wine";

export interface ServingSize {
    amount: number;
    displayName?: string;
    unit: "bottle" | "cl" | "ml";
}

export interface SpecialPrice {
    amount: number;
    // Optional explanation e.g. "Every day 4-6pm"
    description: string;
    // e.g. "Happy Hour", "Early Bird", "Ladies Night"
    label: string;
}

interface DrinkCardBase {
    description: string;
    isActive: boolean;
    name: string;
    organisationId: string;
    propertyId: string;
}

export function isCustomDrinkCard(card: Pick<DrinkCardDoc, "type">): card is CustomDrinkCardDoc {
    return card.type === "custom";
}

export function isPDFDrinkCard(card: Pick<DrinkCardDoc, "type">): card is PDFDrinkCardDoc {
    return card.type === "pdf";
}
