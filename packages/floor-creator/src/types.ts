import { Floor } from "./Floor.js";
import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { ElementTag } from "@firetable/types";
import { Sofa } from "./elements/Sofa";
import { DJBooth } from "./elements/DJBooth";
import { fabric } from "fabric";
import { SingleSofa } from "./elements/SingleSofa";
import { Stage } from "./elements/Stage";

export type FloorDoubleClickHandler = (floor: Floor, coords: NumberTuple) => void;
export type ElementClickHandler = (floor: Floor, el: fabric.Object | undefined) => void;
export type BaseTable = RectTable | RoundTable;
export type FloorEditorElement = RectTable | RoundTable | Sofa | DJBooth | SingleSofa | Stage;
export type CreateElementOptions = {
    label?: string;
    x: number;
    y: number;
    tag: ElementTag;
};

export const enum AnimationDirection {
    UP = "up",
    DOWN = "down",
}

export enum FloorElementTypes {
    ROUND_TABLE = "RoundTable",
    RECT_TABLE = "RectTable",
    DJ_BOOTH = "DJBooth",
    SOFA = "Sofa",
    SINGLE_SOFA = "SingleSofa",
    STAGE = "Stage",
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
