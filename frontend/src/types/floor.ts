import { Reservation } from "./event";

export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json?: string;
}

export const enum ElementType {
    WALL = "wall",
    TABLE = "table",
}

export const enum ElementTag {
    RECT = "rect",
    CIRCLE = "circle",
}

export interface BaseFloorElement {
    id: string;
    type: ElementType;
    tag: ElementTag;
    x: number;
    y: number;
    height: number;
    width: number;
}

export type WallElement = BaseFloorElement;

export interface TableElement extends BaseFloorElement {
    tableId: string;
    floor: string;
    reservation?: Reservation;
}

export interface RoundTable extends TableElement {
    tag: ElementTag.CIRCLE;
}
