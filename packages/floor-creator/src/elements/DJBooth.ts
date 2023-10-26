import { fabric } from "fabric";

export class DJBooth extends fabric.Group {
    constructor(left: number, top: number) {
        const body = new fabric.Rect({
            left: 0,
            top: 0,
            rx: 15,
            ry: 15,
            width: 120,
            height: 60,
            fill: "#1C1C1C",
        });

        const turntable1 = new fabric.Circle({
            left: 20,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F", // Dark Grey
            strokeWidth: 2,
        });

        const turntable2 = new fabric.Circle({
            left: body.width! - 20 - turntable1.width!,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F",
            strokeWidth: 2,
        });

        const djSign = new fabric.Text("DJ", {
            left: 50,
            top: 5,
            fontFamily: "Arial",
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
        });

        const ledSpacing = body.width! / 7; // dividing by total LEDs + 1 for even spacing
        const leds = Array.from({ length: 6 }).map((_, index) => {
            return new fabric.Circle({
                left: ledSpacing * (index + 1),
                top: 57,
                radius: 2,
                fill: "#3498DB",
            });
        });

        super([body, turntable1, turntable2, djSign, ...leds], { left, top });
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(val: string): void {
        // imp
    }
}

// @ts-ignore Register the DJBooth class with Fabric
fabric.DJBooth = fabric.util.createClass(DJBooth);
