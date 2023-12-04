import type { FloorDoc } from "@firetable/types";
import { FLOOR_DEFAULT_HEIGHT, FLOOR_DEFAULT_WIDTH } from "./constants.js";

export function makeRawFloor(name: string, propertyId: string): Omit<FloorDoc, "id" | "json"> {
    return {
        name: name,
        height: FLOOR_DEFAULT_HEIGHT,
        width: FLOOR_DEFAULT_WIDTH,
        propertyId,
    };
}
