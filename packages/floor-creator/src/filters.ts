import { Floor } from "./Floor.js";
import { BaseTable } from "./types.js";
import { FloorDoc } from "@firetable/types";
import { not, propIsTruthy, takeProp } from "@firetable/utils";
import { isTable } from "./type-guards";

export function hasFloorTables(floor: Floor): boolean {
    return getTables(floor).length > 0;
}

export function getTablesFromFloorDoc(floor: FloorDoc): BaseTable[] {
    return floor.json.objects.map((obj: any) => {
        return obj.objects[0];
    });
}

export function getTables(floor: Floor): BaseTable[] {
    const tables: BaseTable[] = [];
    floor.canvas.forEachObject((group) => {
        // @ts-ignore
        group.forEachObject((obj: unknown) => {
            if (isTable(obj)) {
                tables.push(obj);
            }
        });
    });
    return tables;
}

export function getFreeTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(not(propIsTruthy("reservation")));
}

export function getReservedTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(propIsTruthy("reservation"));
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(takeProp("label"));
}
