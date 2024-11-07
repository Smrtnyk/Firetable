import type { FloorEditorElement } from "../types.js";
import { DEFAULT_FONT } from "../constants.js";
import { Circle, Group, Rect, FabricText } from "fabric";

export class DJBooth extends Group implements FloorEditorElement {
    constructor(left: number, top: number) {
        const body = new Rect({
            left: 0,
            top: 0,
            rx: 15,
            ry: 15,
            width: 120,
            height: 60,
            fill: "#1C1C1C",
            evented: false,
        });

        const turntable1 = new Circle({
            left: 20,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F",
            strokeWidth: 2,
            strokeUniform: true,
            evented: false,
        });

        const turntable2 = new Circle({
            left: body.width - 20 - turntable1.width,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F",
            strokeWidth: 2,
            strokeUniform: true,
            evented: false,
        });

        const djSign = new FabricText("DJ", {
            left: 50,
            top: 5,
            fontFamily: DEFAULT_FONT,
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
            evented: false,
        });

        // dividing by total LEDs + 1 for even spacing
        const ledSpacing = body.width / 7;
        const leds = Array.from({ length: 6 }).map(function (_, index) {
            return new Circle({
                left: ledSpacing * (index + 1),
                top: 57,
                radius: 2,
                fill: "#3498DB",
                evented: false,
            });
        });

        super([body, turntable1, turntable2, djSign, ...leds], {
            left,
            top,
            subTargetCheck: false,
        });
    }

    setDimensions(width: number, height: number): void {
        this.scaleX = width / this.width;
        this.scaleY = height / this.height;
        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // imp
    }
}
