import { Floor } from "./Floor.js";
import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { ElementTag } from "@firetable/types";

export type FloorDoubleClickHandler = (floor: Floor, coords: NumberTuple) => void;
export type ElementClickHandler = (floor: Floor, el: BaseTable | null) => void;
export type BaseTable = RectTable | RoundTable;
export type CreateTableOptions = {
    label: string;
    x: number;
    y: number;
    tag: ElementTag;
};

export const enum AnimationDirection {
    UP = "up",
    DOWN = "down",
}

export const enum FloorElementTypes {
    ROUND_TABLE = "RoundTable",
    RECT_TABLE = "RectTable",
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

export type NumberTuple = [number, number];
