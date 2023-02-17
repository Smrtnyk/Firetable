import { Floor } from "./Floor.js";
import { BaseTable, FloorElementTypes } from "./types.js";
import { FloorDoc } from "@firetable/types";
import { not, propIsTruthy, takeProp } from "@firetable/utils";

export function hasFloorTables(floor: Floor): boolean {
    return getTables(floor).length > 0;
}

export function getTablesFromFloorDoc(floor: FloorDoc): BaseTable[] {
    // @ts-ignore
    return floor.json.objects.map((obj: any) => {
        return obj.objects[0];
    });
}

export function getTables(floor: Floor): BaseTable[] {
    const allGroups = floor.canvas.getObjects();
    return allGroups
        .map((group) => {
            return [
                // @ts-ignore -- FIXME: figure out if there is a properly typed API for this
                ...group.getObjects(FloorElementTypes.ROUND_TABLE),
                // @ts-ignore
                ...group.getObjects(FloorElementTypes.RECT_TABLE),
            ];
        })
        .flat();
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
