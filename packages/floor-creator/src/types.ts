import type { RectTable } from "./elements/RectTable.js";
import type { RoundTable } from "./elements/RoundTable.js";
import type { FloorDoc } from "@firetable/types";
import type { Sofa } from "./elements/Sofa";
import type { DJBooth } from "./elements/DJBooth";
import type { Stage } from "./elements/Stage";
import type { SpiralStaircase } from "./elements/SpiralStaircase";

export interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorDoc;
    containerWidth: number;
}

export type BaseTable = RectTable | RoundTable;
export type FloorEditorElement = RectTable | RoundTable | Sofa | DJBooth | Stage | SpiralStaircase;
export type CreateElementOptions = {
    label?: string;
    x: number;
    y: number;
    tag: FloorElementTypes;
};

export enum FloorElementTypes {
    ROUND_TABLE = "RoundTable",
    RECT_TABLE = "RectTable",
    DJ_BOOTH = "DJBooth",
    SOFA = "Sofa",
    STAGE = "Stage",
    WALL = "Wall",
    SPIRAL_STAIRCASE = "SpiralStaircase",
    DOOR = "Door",
}

export type NumberTuple = [number, number];
