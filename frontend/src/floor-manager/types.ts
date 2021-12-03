import { NumberTuple } from "src/types/generic";
import { Floor } from "src/floor-manager/Floor";
import { TableElement } from "src/floor-manager/TableElement";
import { RoundTableElement } from "src/floor-manager/RoundTableElement";
import { ElementTag } from "src/types/floor";

export type FloorDoubleClickHandler = (floor: Floor, coords: NumberTuple) => void;
export type ElementClickHandler = (floor: Floor, el: BaseTable | null) => void;
export type BaseTable = TableElement | RoundTableElement;
export type CreateTableOptions = {
    label: string;
    x: number;
    y: number;
    tag: ElementTag;
};

export const enum FloorElementTypes {
    ROUND_TABLE = "roundTableElement",
    RECT_TABLE = "tableElement",
}

/**
 * EDITOR - When in a map preset editor
 *
 * LIVE   - When in a event page where reservations occur
 */
export const enum FloorMode {
    EDITOR = "EDITOR",
    LIVE = "LIVE",
}
