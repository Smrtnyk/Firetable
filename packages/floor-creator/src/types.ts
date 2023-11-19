import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { ElementTag, FloorDoc } from "@firetable/types";
import { Sofa } from "./elements/Sofa";
import { DJBooth } from "./elements/DJBooth";
import { SingleSofa } from "./elements/SingleSofa";
import { Stage } from "./elements/Stage";

export interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorDoc;
    containerWidth: number;
}

export type BaseTable = RectTable | RoundTable;
export type FloorEditorElement = RectTable | RoundTable | Sofa | DJBooth | SingleSofa | Stage;
export type CreateElementOptions = {
    label?: string;
    x: number;
    y: number;
    tag: ElementTag;
};

export enum FloorElementTypes {
    ROUND_TABLE = "RoundTable",
    RECT_TABLE = "RectTable",
    DJ_BOOTH = "DJBooth",
    SOFA = "Sofa",
    SINGLE_SOFA = "SingleSofa",
    STAGE = "Stage",
    WALL = "Wall",
}

export type NumberTuple = [number, number];
