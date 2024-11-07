import type { BaseTable } from "./types.js";
import { Table } from "./elements/Table.js";

export function isTable(element: unknown): element is BaseTable {
    return element instanceof Table;
}
