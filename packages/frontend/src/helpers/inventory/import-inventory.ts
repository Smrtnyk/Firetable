import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";
import {
    isDrinkItem,
    isRetailItem,
    DrinkMainCategory,
    InventoryItemType,
    RetailMainCategory,
} from "@firetable/types";
import { parse } from "papaparse";
import { addInventoryItem, updateInventoryItem } from "@firetable/backend";
import { getEnumValues } from "src/helpers/get-enum-values";

interface ImportResult {
    updatedCount: number;
    newCount: number;
}

interface ImportInventoryParams {
    fileContent: string;
    existingItems: InventoryItemDoc[];
    organisationId: string;
    propertyId: string;
}

const inventoryItemTypeEnumValues = getEnumValues(InventoryItemType);
const drinkMainCategoryEnumValues = getEnumValues(DrinkMainCategory);
const retailMainCategoryEnumValues = getEnumValues(RetailMainCategory);

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

export async function importInventory({
    fileContent,
    existingItems,
    organisationId,
    propertyId,
}: ImportInventoryParams): Promise<ImportResult> {
    // Parse CSV content
    const parseResults = await new Promise<Papa.ParseResult<CreateInventoryItemPayload>>(
        (resolve, reject) => {
            parse(fileContent, {
                header: true,
                complete: resolve,
                error: reject,
                transform: (value) => value.trim(),
                transformHeader: (header) => header.trim(),
            });
        },
    );

    const importedItems = parseResults.data.map(function (row): CreateInventoryItemPayload {
        const item = {
            name: row.name,
            type: (row.type as InventoryItemType) || InventoryItemType.DRINK,
            mainCategory: row.mainCategory as DrinkMainCategory,
            subCategory: row.subCategory,
            quantity: Number(row.quantity) || 0,
            supplier: row.supplier,
            isActive: row.isActive?.toString() === "true",
            volume: row.volume ? Number(row.volume) : undefined,
            description: row.description,
            region: row.region,
            brand: row.brand,
            style: row.style,
            lastRestockDate: row.lastRestockDate,
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
                    quantity: (existingItem.quantity || 0) + (newItem.quantity || 0),
                    volume: newItem.volume ?? existingItem.volume,
                    description: newItem.description ?? existingItem.description,
                    region: newItem.region ?? existingItem.region,
                    brand: newItem.brand ?? existingItem.brand,
                    style: newItem.style ?? existingItem.style,
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

    return { updatedCount, newCount };
}
