import { FLOOR_DEFAULT_HEIGHT, FLOOR_DEFAULT_WIDTH } from "./constants";
import { FloorDoc } from "src/types/floor";

export function makeRawFloor(name: string): Omit<FloorDoc, "id"> {
    return {
        name: name,
        height: FLOOR_DEFAULT_HEIGHT,
        width: FLOOR_DEFAULT_WIDTH,
    };
}
