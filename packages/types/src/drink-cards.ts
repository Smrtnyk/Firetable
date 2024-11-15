import type { DrinkItem, InventoryItemDoc, InventoryItemType } from "./inventory.js";

interface DrinkCardBase {
    name: string;
    description: string;
    isActive: boolean;
    propertyId: string;
    organisationId: string;
}

export interface PDFDrinkCardDoc extends DrinkCardBase {
    id: string;
    type: "pdf";
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    elements?: never;
}

export interface CustomDrinkCardDoc extends DrinkCardBase {
    id: string;
    type: "custom";
    elements: DrinkCardElement[];
    backgroundImage?: string;
    createdAt: Date;
    updatedAt: Date;
    pdfUrl?: never;
    showItemDescription?: boolean;
    showLogo: boolean;
}

export type DrinkCardDoc = CustomDrinkCardDoc | PDFDrinkCardDoc;

export type CreatePDFDrinkCardPayload = Omit<PDFDrinkCardDoc, "createdAt" | "id" | "updatedAt">;
export type CreateCustomDrinkCardPayload = Omit<
    CustomDrinkCardDoc,
    "createdAt" | "id" | "updatedAt"
>;
export type CreateDrinkCardPayload = CreateCustomDrinkCardPayload | CreatePDFDrinkCardPayload;

export function isPDFDrinkCard(card: Pick<DrinkCardDoc, "type">): card is PDFDrinkCardDoc {
    return card.type === "pdf";
}

export function isCustomDrinkCard(card: Pick<DrinkCardDoc, "type">): card is CustomDrinkCardDoc {
    return card.type === "custom";
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

export interface DrinkCardElement {
    id: string;
    name: string;
    type: "bundle" | "header-end" | "header" | "section";
}

export interface DrinkBundle extends DrinkCardElement {
    type: "bundle";
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
    description?: string;
    isVisible: boolean;
    isHighlighted?: boolean;
}

export interface DrinkCardHeader extends DrinkCardElement {
    type: "header";
    name: "";
}

export interface DrinkCardHeaderEnd extends DrinkCardElement {
    type: "header-end";
}

export interface DrinkCardSection extends DrinkCardElement {
    type: "section";
    template: SectionTemplateId;
    items: DrinkCardItem[];
}

export interface ServingSize {
    amount: number;
    unit: "bottle" | "cl" | "ml";
    displayName?: string;
}

export interface SpecialPrice {
    amount: number;
    // e.g. "Happy Hour", "Early Bird", "Ladies Night"
    label: string;
    // Optional explanation e.g. "Every day 4-6pm"
    description: string;
}

export interface DrinkCardItem {
    inventoryItemId: string;
    price: number;
    /**
     * Special reduced price (e.g. Happy Hour)
     */
    specialPrice: SpecialPrice;

    order: number;
    isVisible: boolean;
    servingSize: ServingSize;
    // Fields copied from inventory
    name: string;
    type: InventoryItemType;
    mainCategory: InventoryItemDoc["mainCategory"];
    subCategory: InventoryItemDoc["subCategory"];
    style?: InventoryItemDoc["style"];
    brand?: InventoryItemDoc["brand"];
    region?: InventoryItemDoc["region"];
    alcoholContent?: InventoryItemDoc extends DrinkItem
        ? InventoryItemDoc["alcoholContent"]
        : never;
    volume?: InventoryItemDoc["volume"];
    description?: InventoryItemDoc["description"];

    // Optional display fields
    /**
     * Featuring special items
     */
    isHighlighted?: boolean;
    /**
     * Tags for special labels
     */
    tags?: string[];
    /**
     *  Whether to show alcohol content
     */
    displayAlcoholContent?: boolean;
    /**
     * Whether to show region/origin
     */
    displayOrigin?: boolean;
    /**
     *  Additional note specific to this menu item
     */
    customNote?: string;
}
