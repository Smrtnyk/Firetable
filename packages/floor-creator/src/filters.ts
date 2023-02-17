import { Floor } from "./Floor.js";
import { BaseTable, FloorElementTypes } from "./types.js";
import { FloorDoc } from "@firetable/types";
import { takeProp } from "@firetable/utils";

export function hasFloorTables(floor: Floor): boolean {
    const allGroups = floor.canvas.getObjects();
    for (const group of allGroups) {
        if (
            // @ts-ignore
            group.getObjects(FloorElementTypes.ROUND_TABLE).length ||
            // @ts-ignore
            group.getObjects(FloorElementTypes.RECT_TABLE).length
        ) {
            return true;
        }
    }
    return false;
}

export function getTablesFromFloorDoc(floor: FloorDoc): BaseTable[] {
    // @ts-ignore
    return floor.json.objects.map((obj: any) => {
        return obj.objects[0];
    });
}

export function getTables(floor: Floor): BaseTable[] {
    return [
        ...(floor.canvas.getObjects(FloorElementTypes.ROUND_TABLE) as BaseTable[]),
        ...(floor.canvas.getObjects(FloorElementTypes.RECT_TABLE) as BaseTable[]),
    ];
}

export function getFreeTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(({ reservation }) => !reservation);
}

export function getReservedTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(({ reservation }) => !!reservation);
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(takeProp("label"));
}
