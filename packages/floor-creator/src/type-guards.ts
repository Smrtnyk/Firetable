import type { BaseTable } from "./types.js";
import { RoundTable } from "./elements/RoundTable.js";
import { RectTable } from "./elements/RectTable.js";
import { EditableShape } from "./elements/EditableShape.js";

export function isTable(element: unknown): element is BaseTable {
    return element instanceof RectTable || element instanceof RoundTable;
}

export function isLabelable(element: unknown): element is BaseTable | EditableShape {
    return (isTable(element) && element.label !== undefined) || element instanceof EditableShape;
}
