import { Floor } from "src/floor-manager/Floor";
import { BaseTable, FloorElementTypes } from "src/floor-manager/types";

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

export function getTables(floor: Floor): BaseTable[] {
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
    return getTables(floor).filter(({ reservation }) => !reservation);
}

export function getReservedTables(floor: Floor): BaseTable[] {
    return getTables(floor).filter(({ reservation }) => !!reservation);
}

export function extractAllTablesLabels(floor: Floor): string[] {
    return getTables(floor).map(({ label }) => label);
}
