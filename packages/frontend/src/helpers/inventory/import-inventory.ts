import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";

import { addInventoryItem, updateInventoryItem } from "@firetable/backend";
import {
    DrinkMainCategory,
    InventoryItemType,
    isDrinkItem,
    isRetailItem,
    RetailMainCategory,
} from "@firetable/types";
import { parse } from "papaparse";
import { getEnumValues } from "src/helpers/get-enum-values";

interface ImportInventoryParams {
    existingItems: InventoryItemDoc[];
    fileContent: string;
    organisationId: string;
    propertyId: string;
}

interface ImportResult {
    newCount: number;
    updatedCount: number;
}

const inventoryItemTypeEnumValues = getEnumValues(InventoryItemType);
const drinkMainCategoryEnumValues = getEnumValues(DrinkMainCategory);
const retailMainCategoryEnumValues = getEnumValues(RetailMainCategory);

export async function importInventory({
    existingItems,
    fileContent,
    organisationId,
    propertyId,
}: ImportInventoryParams): Promise<ImportResult> {
    const parseResults = await new Promise<Papa.ParseResult<CreateInventoryItemPayload>>(
        (resolve, reject) => {
            parse(fileContent, {
                complete: resolve,
                error: reject,
                header: true,
                transform: (value) => value.trim(),
                transformHeader: (header) => header.trim(),
            });
        },
    );

    const importedItems = parseResults.data.map(function (row): CreateInventoryItemPayload {
        const item = {
            brand: row.brand,
            description: row.description,
            isActive: row.isActive?.toString() === "true",
            lastRestockDate: row.lastRestockDate,
            mainCategory: row.mainCategory as DrinkMainCategory,
            name: row.name,
            quantity: Number(row.quantity) || 0,
            region: row.region,
            style: row.style,
            subCategory: row.subCategory,
            supplier: row.supplier,
            type: (row.type as InventoryItemType) || InventoryItemType.DRINK,
            volume: row.volume ? Number(row.volume) : undefined,
        };
        const alcoholContent = isDrinkItem(row) ? Number(row.alcoholContent) : undefined;
        if (alcoholContent) {
            Object.assign(item, { alcoholContent });
        }

        return JSON.parse(JSON.stringify(item));
    });

    const validItems = importedItems.filter(isValidItem);

    if (validItems.length === 0) {
        throw new Error("No valid items found in CSV");
    }

    // Group existing items by their unique identifier
    const existingItemsMap = new Map(
        existingItems.map(function (item) {
            const key = `${item.name}-${item.type}-${item.mainCategory}-${item.subCategory}`;
            return [key, item];
        }),
    );

    let updatedCount = 0;
    let newCount = 0;

    await Promise.all(
        validItems.map(async function (newItem) {
            const key = `${newItem.name}-${newItem.type}-${newItem.mainCategory}-${newItem.subCategory}`;
            const existingItem = existingItemsMap.get(key);

            if (existingItem) {
                const mergedItem: CreateInventoryItemPayload = {
                    ...newItem,
                    brand: newItem.brand ?? existingItem.brand,
                    description: newItem.description ?? existingItem.description,
                    quantity: (existingItem.quantity || 0) + (newItem.quantity || 0),
                    region: newItem.region ?? existingItem.region,
                    style: newItem.style ?? existingItem.style,
                    volume: newItem.volume ?? existingItem.volume,
                };

                let alcoholContent: number | undefined;

                if (isDrinkItem(newItem)) {
                    alcoholContent = newItem.alcoholContent;
                } else if (isDrinkItem(existingItem)) {
                    alcoholContent = existingItem.alcoholContent;
                }

                if (alcoholContent) {
                    Object.assign(mergedItem, { alcoholContent });
                }

                await updateInventoryItem(organisationId, propertyId, existingItem.id, mergedItem);
                updatedCount++;
            } else {
                await addInventoryItem(organisationId, propertyId, newItem);
                newCount++;
            }
        }),
    );

    return { newCount, updatedCount };
}

function isValidItem(item: CreateInventoryItemPayload): boolean {
    const basicValidation = item.name && item.type && item.mainCategory && item.subCategory;
    if (!basicValidation) {
        return false;
    }

    const validType = inventoryItemTypeEnumValues.includes(item.type);
    if (!validType) {
        return false;
    }

    if (isDrinkItem(item)) {
        return drinkMainCategoryEnumValues.includes(item.mainCategory);
    }
    if (isRetailItem(item)) {
        return retailMainCategoryEnumValues.includes(item.mainCategory);
    }
    return false;
}
