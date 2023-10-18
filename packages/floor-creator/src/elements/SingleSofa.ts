import { fabric } from "fabric";

export class SingleSofa extends fabric.Group {
    constructor(left: number, top: number) {
        const base = new fabric.Rect({
            left: 0,
            top: 0,
            rx: 10,
            ry: 10,
            width: 60, // Width is reduced for single seater
            height: 30,
            fill: "#8B4513",
            stroke: "black",
            strokeWidth: 1,
        });

        const backrest = new fabric.Rect({
            left: 0,
            top: -20,
            rx: 10,
            ry: 10,
            width: 60,
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
            left: 50, // Adjusted for the reduced width
            top: 0,
            rx: 10,
            ry: 10,
            width: 20,
            height: 35,
            fill: "#8B4513",
            stroke: "black",
            strokeWidth: 1,
        });

        const cushion = new fabric.Rect({
            left: 10, // Centered the cushion for single-seater
            top: 0,
            rx: 5,
            ry: 5,
            width: 40, // Cushion width adjusted for single-seater
            height: 35,
            fill: "#A0522D",
            stroke: "black",
            strokeWidth: 1,
        });

        super([base, backrest, armrestLeft, armrestRight, cushion], { left, top });
    }
}

// @ts-ignore Register the SingleSofa class with Fabric
fabric.SingleSofa = fabric.util.createClass(SingleSofa);
