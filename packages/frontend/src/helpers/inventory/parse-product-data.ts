import type { CreateInventoryItemPayload, DrinkCategory } from "@firetable/types";
import { InventoryItemType } from "@firetable/types";

function extractCategory(categories: string | undefined): DrinkCategory {
    if (!categories) {
        return "" as DrinkCategory;
    }
    // Categories are separated by commas; take the most relevant one
    const categoryList = categories.split(",").map(function (cat) {
        return cat.trim();
    });
    return (categoryList[0] ?? "") as DrinkCategory;
}

function extractQuantity(quantityStr: string | undefined): number {
    if (!quantityStr) {
        return 0;
    }
    // Extract numerical value from the quantity string
    const match = /[\d.]+/.exec(quantityStr);
    return match ? Number.parseFloat(match[0]) : 0;
}

function determineItemType(categories: string | undefined): InventoryItemType {
    if (!categories) {
        return InventoryItemType.OTHER;
    }
    const lowerCategories = categories.toLowerCase();
    if (lowerCategories.includes("beverages") || lowerCategories.includes("drinks")) {
        return InventoryItemType.DRINK;
    } else if (lowerCategories.includes("food") || lowerCategories.includes("snacks")) {
        return InventoryItemType.FOOD;
    }
    return InventoryItemType.OTHER;
}

function extractAlcoholContent(nutriments: any): number {
    if (!nutriments) return 0;
    // Open Food Facts may have 'alcohol' content in grams or percentage
    if (nutriments.alcohol) {
        return Number.parseFloat(nutriments.alcohol) || 0;
    } else if (nutriments.alcohol_value) {
        return Number.parseFloat(nutriments.alcohol_value) || 0;
    }
    return 0;
}

function extractVolume(quantityStr: string | undefined): number {
    if (!quantityStr) {
        return 0;
    }
    // Assuming volume is included in quantity for drinks
    return extractQuantity(quantityStr);
}

export function parseProductData(product: Record<string, any>): CreateInventoryItemPayload {
    const name = product.product_name;

    if (!name) {
        throw new Error("Product name was not found in the data");
    }

    return {
        name,
        category: extractCategory(product.categories) || "",
        /**
         * Price is dictated by the property and the owner
         */
        price: 0,
        /**
         * Set to 1 and user can modify it as it wants
         */
        quantity: 1,
        supplier: product.brands || "",
        type: determineItemType(product.categories) || InventoryItemType.OTHER,
        alcoholContent: extractAlcoholContent(product.nutriments) || 0,
        volume: extractVolume(product.serving_quantity) || 0,
    };
}
