import { NumberTuple } from "src/types/generic";
import { Floor } from "src/floor-manager/Floor";

export type FloorDoubleClickHandler = (floor: Floor, coords: NumberTuple) => void;
export type ElementClickHandler = (floor: Floor, el: any) => void;

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
