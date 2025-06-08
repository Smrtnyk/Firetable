import type { FabricObject } from "fabric";

import type { RectTable } from "./elements/RectTable.js";
import type { RoundTable } from "./elements/RoundTable.js";
import type { FloorViewer } from "./FloorViewer.js";

export enum FloorElementTypes {
    BAR = "Bar",
    CLOAKROOM = "Cloakroom",
    DJ_BOOTH = "DJBooth",
    DOOR = "Door",
    EDITABLE_CIRCLE = "EditableCircle",
    EDITABLE_RECT = "EditableRect",
    RECT_TABLE = "RectTable",
    ROUND_TABLE = "RoundTable",
    SOFA = "Sofa",
    SPIRAL_STAIRCASE = "SpiralStaircase",
    STAGE = "Stage",
    TEXT = "Text",
    WALL = "Wall",
}
export type BaseTable = RectTable | RoundTable;

export type CreateElementOptions = {
    label?: string;
    tag: FloorElementTypes;
    x: number;
    y: number;
};

export interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    floorDoc: FloorData;
}

export interface FloorData {
    height: number;
    id: string;
    json: Record<string, any> | string;
    name: string;
    width: number;
}

export type FloorDropEvent = { data: string | undefined; x: number; y: number };

export interface FloorEditorElement extends FabricObject {
    flip?(): void;

    getBaseFill(): string;
    nextDesign?(): void;

    setBaseFill(fill: string): void;
}

export type FloorElementClickHandler = (
    floor: FloorViewer,
    element: FloorEditorElement | undefined,
) => Promise<void> | void;

export type NumberTuple = [number, number];
export type ToTuple<T> = T extends [] | [unknown, ...unknown[]] ? T : [T];
