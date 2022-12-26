import { TableElement } from "./TableElement.js";
import { RoundTableElement } from "./RoundTableElement.js";
import { BaseTable } from "./types.js";

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RoundTableElement || element instanceof TableElement;
}

export function isRoundTable(element: unknown): element is RoundTableElement {
    return element instanceof RoundTableElement;
}
