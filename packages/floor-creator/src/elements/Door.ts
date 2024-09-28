import { ELEMENT_DEFAULT_STROKE_COLOR } from "../constants.js";
import { Group, Line, Path } from "fabric";

export class Door extends Group {
    constructor(left: number, top: number) {
        const doorLine = new Line([0, 0, 0, 50], {
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 5,
        });

        const doorArcPath = "M 0,0 Q 50,0, 50,50";
        const doorArc = new Path(doorArcPath, {
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 1,
            fill: null,
            strokeDashArray: [3, 3],
            strokeLineCap: "round",
            strokeLineJoin: "round",
        });

        super([doorLine, doorArc], { top, left });
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // impl
    }
}
