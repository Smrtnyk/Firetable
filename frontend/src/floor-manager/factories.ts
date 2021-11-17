import {
    FLOOR_DEFAULT_HEIGHT,
    FLOOR_DEFAULT_WIDTH,
    INITIAL_WALL_HEIGHT,
    RESOLUTION,
} from "./constants";
import { getTableHeight, getTableWidth } from "./utils";
import { uid } from "quasar";
import { BaseFloorElement, ElementTag, ElementType, FloorDoc, TableElement } from "src/types/floor";

type CreateTableElementPayload = Pick<TableElement, "tableId" | "floor" | "x" | "y" | "tag">;

export function makeRawFloor(name: string): Omit<FloorDoc, "id"> {
    return {
        name: name,
        data: [
            makeRawTable({
                tableId: "1",
                floor: name,
                x: 124,
                y: 176,
                tag: ElementTag.RECT,
            }),
        ],
        height: FLOOR_DEFAULT_HEIGHT,
        width: FLOOR_DEFAULT_WIDTH,
    };
}

export function makeRawWall(x: number, y: number): BaseFloorElement {
    return {
        x,
        y,
        type: ElementType.WALL,
        tag: ElementTag.RECT,
        width: RESOLUTION,
        height: INITIAL_WALL_HEIGHT,
        id: uid(),
    };
}

export function makeRawTable(tableElementPayload: CreateTableElementPayload): TableElement {
    return {
        ...tableElementPayload,
        width: getTableWidth(),
        height: getTableHeight(),
        type: ElementType.TABLE,
        id: uid(),
    };
}
