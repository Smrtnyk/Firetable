import { TableElement } from "src/floor-manager/TableElement";
import { RoundTableElement } from "src/floor-manager/RoundTableElement";
import { BaseTable } from "src/floor-manager/types";

export function isWall(element: any): element is any {
    return true;
}

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RoundTableElement || element instanceof TableElement;
}

export function isRoundTable(element: unknown): element is RoundTableElement {
    return element instanceof RoundTableElement;
}
