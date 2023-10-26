import { fabric } from "fabric";
import { RESOLUTION } from "../constants";
import { FloorElementTypes } from "../types";

export class SingleSofa extends fabric.Group {
    type = FloorElementTypes.SINGLE_SOFA;
    constructor(left: number, top: number) {
        const base = new fabric.Rect({
            left: 0,
            top: 0,
            width: RESOLUTION * 2,
            height: RESOLUTION / 2,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
        });

        const backrest = new fabric.Rect({
            left: 0,
            top: -RESOLUTION / 4,
            width: RESOLUTION * 2,
            height: RESOLUTION / 4,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
        });

        super([base, backrest], { left, top });
    }

    static fromObject(object: any, callback: (obj: SingleSofa) => void): void {
        const instance = new SingleSofa(object.left, object.top);
        callback(instance);
    }
}

// @ts-ignore Register the SingleSofa class with Fabric
fabric.SingleSofa = fabric.util.createClass(SingleSofa);
// @ts-ignore Register the SingleSofa class with Fabric
fabric.SingleSofa.fromObject = SingleSofa.fromObject;
