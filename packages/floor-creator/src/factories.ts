import { FLOOR_DEFAULT_HEIGHT, FLOOR_DEFAULT_WIDTH } from "./constants.js";
import { FloorDoc } from "@firetable/types";
import { fabric } from "fabric";

export function makeRawFloor(name: string): Omit<FloorDoc, "id" | "json"> {
    return {
        name: name,
        height: FLOOR_DEFAULT_HEIGHT,
        width: FLOOR_DEFAULT_WIDTH,
    };
}

export function createGroup(
    objects: fabric.Object[],
    options: Record<string, string | number | boolean>
): fabric.Group {
    return new fabric.Group(objects, options);
}
