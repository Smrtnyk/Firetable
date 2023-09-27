import { fabric } from "fabric";

export class Sofa extends fabric.Group {
    constructor(left: number, top: number) {
        const base = new fabric.Rect({
            left: 0,
            top: 0,
            rx: 10,
            ry: 10,
            width: 100,
            height: 30,
            fill: "#8B4513", // SaddleBrown
            stroke: "black",
            strokeWidth: 1,
        });

        const backrest = new fabric.Rect({
            left: 0,
            top: -20,
            rx: 10,
            ry: 10,
            width: 100,
            height: 20,
            fill: "#8B4513",
            stroke: "black",
            strokeWidth: 1,
        });

        const armrestLeft = new fabric.Rect({
            left: -10,
            top: 0,
            rx: 10,
            ry: 10,
            width: 20,
            height: 35,
            fill: "#8B4513",
            stroke: "black",
            strokeWidth: 1,
        });

        const armrestRight = new fabric.Rect({
            left: 90,
            top: 0,
            rx: 10,
            ry: 10,
            width: 20,
            height: 35,
            fill: "#8B4513",
            stroke: "black",
            strokeWidth: 1,
        });

        const cushion1 = new fabric.Rect({
            left: 15,
            top: 0,
            rx: 5,
            ry: 5,
            width: 35,
            height: 35,
            fill: "#A0522D", // Sienna
            stroke: "black",
            strokeWidth: 1,
        });

        const cushion2 = new fabric.Rect({
            left: 50,
            top: 0,
            rx: 5,
            ry: 5,
            width: 35,
            height: 35,
            fill: "#A0522D",
            stroke: "black",
            strokeWidth: 1,
        });

        super([base, backrest, armrestLeft, armrestRight, cushion1, cushion2], { left, top });
    }
}

// @ts-ignore Register the Sofa class with Fabric
fabric.Sofa = fabric.util.createClass(Sofa);
