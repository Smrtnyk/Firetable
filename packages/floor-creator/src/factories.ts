import type { FloorData } from "./types.js";
import { FLOOR_DEFAULT_HEIGHT, FLOOR_DEFAULT_WIDTH } from "./constants.js";

export function makeRawFloor(name: string): Omit<FloorData, "id" | "json"> {
    return {
        name: name,
        height: FLOOR_DEFAULT_HEIGHT,
        width: FLOOR_DEFAULT_WIDTH,
    };
}
