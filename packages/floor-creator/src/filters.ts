import type { Floor } from "./Floor.js";
import type { BaseTable } from "./types.js";
import type { FloorDoc } from "@firetable/types";
import { isTable } from "./type-guards";
import { isString, takeProp } from "@firetable/utils";

export function hasFloorTables(floor: Floor): boolean {
    return getTables(floor).length > 0;
}

export function getTablesFromFloorDoc(floor: FloorDoc): BaseTable[] {
    if (isString(floor.json)) {
        return JSON.parse(floor.json).objects.filter(isTable);
    }
    return floor.json.objects.filter(isTable);
}

export function getTables(floor: Floor): BaseTable[] {
    return floor.canvas.getObjects().filter(isTable);
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(takeProp("label"));
}
