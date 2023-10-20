import { fabric } from "fabric";

export class Stage extends fabric.Group {
    constructor(left: number, top: number) {
        const stageBody = new fabric.Rect({
            left: 0,
            top: 0,
            rx: 15,
            ry: 15,
            width: 150,
            height: 90,
            fill: "#222",
            stroke: "#111",
            strokeWidth: 1,
        });

        const decor = new fabric.Rect({
            left: 35,
            top: stageBody.height! - 25,
            width: 80,
            height: 20,
            fill: "#6247aa",
        });

        const stageLabel = new fabric.Text("STAGE", {
            left: stageBody.width! / 2,
            top: stageBody.height! / 2,
            fontFamily: "Arial",
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
        });

        // LEDs for the stage edges
        const ledSpacingHeight = stageBody.height! / 5; // For even spacing

        const ledsLeftRight = Array.from({ length: 4 })
            .map((_, index) => {
                return [
                    new fabric.Circle({
                        left: -1,
                        top: ledSpacingHeight * (index + 1),
                        radius: 2,
                        fill: "#3498DB",
                    }),
                    new fabric.Circle({
                        left: stageBody.width! - 3,
                        top: ledSpacingHeight * (index + 1),
                        radius: 2,
                        fill: "#3498DB",
                    }),
                ];
            })
            .flat();

        super([stageBody, decor, stageLabel, ...ledsLeftRight], {
            left,
            top,
        });

        // Ensure this is always in the background
        this.moveTo(-1);
    }
}

// @ts-ignore Register the PerformanceStage class with Fabric
fabric.Stage = fabric.util.createClass(Stage);
