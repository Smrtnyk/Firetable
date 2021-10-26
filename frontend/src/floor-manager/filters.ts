import { FloorDoc } from "src/types/floor";
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

export function extractAllTableIds(floor: Floor) {
    return floor.tables.map((table) => table.tableId);
}
