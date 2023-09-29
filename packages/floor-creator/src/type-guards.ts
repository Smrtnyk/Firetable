import { RoundTable } from "./elements/RoundTable.js";
import { BaseTable, FloorEditorElement, FloorElementTypes } from "./types.js";
import { RectTable } from "./elements/RectTable";

export function isFloorElement(element: unknown): element is FloorEditorElement {
    return (
        !!element &&
        typeof element === "object" &&
        "type" in element &&
        typeof element.type === "string" &&
        Object.values(FloorElementTypes).includes(element.type as FloorElementTypes)
    );
}

export function isTable(element: unknown): element is BaseTable {
    return isRectTable(element) || isRoundTable(element);
}

export function isRectTable(element: unknown): element is RectTable {
    return (
        !!element &&
        typeof element === "object" &&
        "type" in element &&
        element.type === FloorElementTypes.RECT_TABLE
    );
}

export function isRoundTable(element: unknown): element is RoundTable {
    return (
        !!element &&
        typeof element === "object" &&
        "type" in element &&
        element.type === FloorElementTypes.ROUND_TABLE
    );
}
