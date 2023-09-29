import { fabric } from "fabric";

export class DJBooth extends fabric.Group {
    constructor(left: number, top: number) {
        // Main Body of DJ Booth
        const body = new fabric.Rect({
            left: 0,
            top: 0,
            width: 100,
            height: 40,
            fill: "black",
        });

        // Table Surface for placing equipment
        const tableSurface = new fabric.Rect({
            left: 10,
            top: -5,
            width: 80,
            height: 5,
            fill: "grey",
        });

        // Two Turntables or CDJs
        const turntable1 = new fabric.Circle({
            left: 5,
            top: -15,
            radius: 10,
            fill: "black",
            stroke: "white",
            strokeWidth: 2,
        });

        const turntable2 = new fabric.Circle({
            left: 75,
            top: -15,
            radius: 10,
            fill: "black",
            stroke: "white",
            strokeWidth: 2,
        });

        // DJ Mixer in the middle
        const mixer = new fabric.Rect({
            left: 40,
            top: -15,
            width: 20,
            height: 10,
            fill: "silver",
        });

        // Optional: You could also add labels or icons on turntables and mixer for more details

        super([body, tableSurface, turntable1, turntable2, mixer], { left, top });
    }
}

// @ts-ignore Register the DJBooth class with Fabric
fabric.DJBooth = fabric.util.createClass(DJBooth);
