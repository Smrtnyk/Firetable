import { EnterElement, Selection } from "d3-selection";
import { BaseFloorElement, TableElement } from "src/types";
import { D3DragEvent } from "d3-drag";
import type { Floor } from "src/floor-manager/Floor";
import { NumberTuple } from "src/types/generic";

export type FTDragEvent = D3DragEvent<Element, BaseFloorElement, unknown>;

export type ElementClickHandler = (
    floor: Floor | null,
    d: BaseFloorElement | null
) => void;
export type FloorDoubleClickHandler = (
    floor: Floor,
    coords: NumberTuple
) => void;

export type tableElementGroupSelection = Selection<
    EnterElement,
    TableElement,
    SVGGElement,
    unknown
>;

export type baseElementGroupSelection = Selection<
    SVGGElement,
    BaseFloorElement,
    Element,
    unknown
>;

export type tableElementInit = Pick<
    TableElement,
    "tableId" | "x" | "y" | "tag"
>;
