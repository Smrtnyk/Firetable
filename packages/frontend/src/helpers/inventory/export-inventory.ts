import type { InventoryItemDoc } from "@firetable/types";

import { isDrinkItem } from "@firetable/types";

import { exportFile } from "../export-file";

export function exportInventory(items: InventoryItemDoc[]): void {
    // Headers exactly matching the interface property names
    const headers = [
        "name",
        "type",
        "mainCategory",
        "subCategory",
        "quantity",
        "volume",
        "brand",
        "style",
        "region",
        "supplier",
        "alcoholContent",
        "description",
        "isActive",
        "lastRestockDate",
    ].join(",");

    const rows = items.map(function (item) {
        return [
            escapeCsvField(item.name),
            escapeCsvField(item.type),
            escapeCsvField(item.mainCategory),
            escapeCsvField(item.subCategory),
            item.quantity || 0,
            item.volume ?? "",
            escapeCsvField(item.brand ?? ""),
            escapeCsvField(item.style ?? ""),
            escapeCsvField(item.region ?? ""),
            escapeCsvField(item.supplier ?? ""),
            isDrinkItem(item) ? (item.alcoholContent ?? "") : "",
            escapeCsvField(item.description ?? ""),
            // Export boolean as string "true"/"false" for proper import
            item.isActive?.toString() ?? "true",
            item.lastRestockDate ?? "",
        ].join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

    // we generate filename with date just so we can see immediately when the export was done
    const date = new Date().toISOString().split("T")[0];
    const filename = `inventory_export_${date}.csv`;
    exportFile(blob, filename);
}

function escapeCsvField(field: string): string {
    // If the field contains commas, quotes, or newlines, wrap it in quotes and escape any existing quotes
    if (/[\n\r",]/.test(field)) {
        return `"${field.replaceAll('"', '""')}"`;
    }
    return field;
}
