import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { BaseTable } from "./types.js";

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RoundTable || element instanceof RectTable;
}

export function isRoundTable(element: unknown): element is RoundTable {
    return element instanceof RoundTable;
}
