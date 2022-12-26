import { Floor } from "./Floor.js";
import { BaseTable, FloorElementTypes } from "./types.js";
import { FloorDoc, isNone, isSome } from "@firetable/types";

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return floor.canvas
        .getObjects()
        .map((obj) => {
            return [
                // @ts-ignore
                ...obj.getObjects(FloorElementTypes.ROUND_TABLE),
                // @ts-ignore
                ...obj.getObjects(FloorElementTypes.RECT_TABLE),
            ];
        })
        .flat();
}

export function getFreeTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(({ reservation }) => isNone(reservation));
}

export function getReservedTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(({ reservation }) => !isSome(reservation));
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(({ label }) => label);
}
