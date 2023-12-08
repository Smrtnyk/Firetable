import { Group, Rect, FabricText, Circle } from "fabric";

export class Stage extends Group {
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
        });

        const decor = new Rect({
            left: 35,
            top: stageBody.height - 25,
            width: 80,
            height: 20,
            fill: "#6247aa",
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
        });

        // LEDs for the stage front
        const ledSpacingWidth = stageBody.width / 5; // For even spacing

        const ledsFront = Array.from({ length: 4 }).map((_, index) => {
            return new Circle({
                left: ledSpacingWidth * (index + 1),
                top: 2,
                radius: 2,
                fill: "#3498DB",
            });
        });

        super([stageBody, decor, stageLabel, ...ledsFront], {
            left,
            top,
        });

        // Ensure this is always in the background
        // this.moveTo(-1);
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // imp
    }
}
