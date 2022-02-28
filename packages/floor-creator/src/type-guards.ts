import { TableElement } from "./TableElement";
import { RoundTableElement } from "./RoundTableElement";
import { BaseTable } from "./types";

export function isWall(element: any): element is any {
    return true;
}

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RoundTableElement || element instanceof TableElement;
}

export function isRoundTable(element: unknown): element is RoundTableElement {
    return element instanceof RoundTableElement;
}
