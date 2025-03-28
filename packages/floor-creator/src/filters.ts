import { isString } from "es-toolkit";
import { property } from "es-toolkit/compat";

import type { Floor } from "./Floor.js";
import type { BaseTable, FloorData } from "./types.js";

import { isTable } from "./type-guards.js";
import { FloorElementTypes } from "./types.js";

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(property("label"));
}

export function getTables(floor: Floor): BaseTable[] {
    return floor.canvas.getObjects().filter(isTable);
}

export function getTablesFromFloorDoc(floor: FloorData): BaseTable[] {
    if (isString(floor.json)) {
        return JSON.parse(floor.json).objects.filter(isSerializedTable);
    }
    return floor.json.objects.filter(isSerializedTable);
}

export function hasFloorTables(floor: Floor): boolean {
    return getTables(floor).length > 0;
}

function isSerializedTable(element: Record<PropertyKey, unknown>): boolean {
    return (
        "type" in element &&
        (element.type === FloorElementTypes.RECT_TABLE ||
            element.type === FloorElementTypes.ROUND_TABLE)
    );
}
