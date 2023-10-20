import { fabric } from "fabric";
import { RESOLUTION } from "../constants";

export class Sofa extends fabric.Group {
    constructor(left: number, top: number) {
        const base = new fabric.Rect({
            left: 0,
            top: 0,
            width: RESOLUTION * 4,
            height: RESOLUTION / 2,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
        });

        const backrest = new fabric.Rect({
            left: 0,
            top: -RESOLUTION / 4,
            width: RESOLUTION * 4,
            height: RESOLUTION / 4,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
        });

        super([base, backrest], { left, top });
    }
}

// @ts-ignore Register the Sofa class with Fabric
fabric.Sofa = fabric.util.createClass(Sofa);
