import type { FloorEditorElement } from "../types.js";
import { Group, Rect, FabricText, Circle } from "fabric";

export class Stage extends Group implements FloorEditorElement {
    constructor(left: number, top: number) {
        const stageBody = new Rect({
            left: 0,
            top: 0,
            rx: 10,
            ry: 10,
            width: 150,
            height: 25 * 4,
            fill: "#222",
            stroke: "#111",
            strokeWidth: 1,
            strokeUniform: true,
            evented: false,
        });

        const decor = new Rect({
            left: 35,
            top: stageBody.height - 25,
            width: 80,
            height: 20,
            fill: "#6247aa",
            evented: false,
        });

        const stageLabel = new FabricText("STAGE", {
            left: stageBody.width / 2,
            top: stageBody.height / 2,
            fontFamily: "Arial",
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            evented: false,
        });

        // LEDs for the stage front
        // For even spacing
        const ledSpacingWidth = stageBody.width / 5;

        const ledsFront = Array.from({ length: 4 }).map(function (_, index) {
            return new Circle({
                left: ledSpacingWidth * (index + 1),
                top: 2,
                radius: 2,
                fill: "#3498DB",
                evented: false,
            });
        });

        super([stageBody, decor, stageLabel, ...ledsFront], {
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
