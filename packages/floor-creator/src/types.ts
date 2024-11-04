import type { RectTable } from "./elements/RectTable.js";
import type { RoundTable } from "./elements/RoundTable.js";
import type { FabricObject } from "fabric";
import type { FloorViewer } from "./FloorViewer.js";

export type ToTuple<T> = T extends [] | [unknown, ...unknown[]] ? T : [T];
export type FloorElementClickHandler = (
    floor: FloorViewer,
    element: FloorEditorElement | undefined,
) => Promise<void> | void;

export interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorData;
    containerWidth: number;
}

export interface FloorData {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any> | string;
}

export type BaseTable = RectTable | RoundTable;

export interface FloorEditorElement extends FabricObject {
    flip?(): void;

    getBaseFill(): string;
    setBaseFill(fill: string): void;

    changeToOutlinedMode?(): void;
    changeToFilledMode?(): void;
}

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
    EDITABLE_RECT = "EditableRect",
    EDITABLE_CIRCLE = "EditableCircle",
}

export type NumberTuple = [number, number];
export type FloorDropEvent = { x: number; y: number; data: string | undefined };
