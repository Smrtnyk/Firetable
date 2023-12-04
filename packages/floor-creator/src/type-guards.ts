import type { BaseTable } from "./types.js";
import { RoundTable } from "./elements/RoundTable.js";
import { RectTable } from "./elements/RectTable";

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RectTable || element instanceof RoundTable;
}
