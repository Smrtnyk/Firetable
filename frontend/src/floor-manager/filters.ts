import { FloorDoc, TableElement } from "src/types/floor";
import { isTable } from "src/floor-manager/type-guards";
import type { Floor } from "src/floor-manager/Floor";

export function hasFloorTables(floor: Floor) {
    return !!floor.tables.length;
}

export function getTables(floor: Floor | FloorDoc) {
    return floor.data.filter(isTable);
}

export function getFreeTables(floor: Floor | FloorDoc) {
    return getTables(floor).filter((table) => !table.reservation);
}

export function getReservedTables(floor: Floor | FloorDoc) {
    return getTables(floor).filter((table) => !!table.reservation);
}

export function getTable(floor: Floor, tableId: string) {
    return floor.tables.find((table) => table.tableId === tableId);
}

export function extractAllTableIds(floor: Floor) {
    return floor.tables.map((table) => table.tableId);
}

export function getAllReservedTables(floors: Floor[]) {
    return floors
        .map((floor) => floor.tables)
        .flat()
        .filter((d: TableElement) => !!d.reservation);
}
