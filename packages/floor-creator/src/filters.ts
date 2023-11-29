import { Floor } from "./Floor.js";
import { BaseTable } from "./types.js";
import { FloorDoc } from "@firetable/types";
import { propIsTruthy, takeProp } from "@firetable/utils";
import { isTable } from "./type-guards";

export function hasFloorTables(floor: Floor): boolean {
    return getTables(floor).length > 0;
}

export function getTablesFromFloorDoc(floor: FloorDoc): BaseTable[] {
    return JSON.parse(floor.json).objects.filter(isTable);
}

export function getTables(floor: Floor): BaseTable[] {
    const tables: BaseTable[] = [];
    floor.canvas.forEachObject((group) => {
        if (isTable(group)) {
            tables.push(group);
        }
    });
    return tables;
}

export function getReservedTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(propIsTruthy("reservation"));
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(takeProp("label"));
}
