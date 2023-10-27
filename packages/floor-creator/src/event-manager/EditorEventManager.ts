import { EventManager } from "./EventManager";
import { fabric } from "fabric";
import { RESOLUTION } from "../constants";

export class EditorEventManager extends EventManager {
    initializeCanvasEventHandlers() {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("object:modified", this.snapToGridOnModify);
    }

    private snapToGridOnModify = (e: fabric.IEvent) => {
        const target = e.target;

        if (target) {
            // Snapping logic for rotation
            const snapAngle = 45; // 45 degrees
            const threshold = 5; // degrees
            const closestMultipleOfSnap = Math.round(target.angle! / snapAngle) * snapAngle;
            const differenceFromSnap = Math.abs(target.angle! - closestMultipleOfSnap);
            if (differenceFromSnap <= threshold) {
                target.set("angle", closestMultipleOfSnap).setCoords();
            }

            // Snapping logic for movement
            const shouldSnapToGrid =
                Math.round((target.left! / RESOLUTION) * 4) % 4 === 0 &&
                Math.round((target.top! / RESOLUTION) * 4) % 4 === 0;
            if (shouldSnapToGrid) {
                target
                    .set({
                        left: Math.round(target.left! / RESOLUTION) * RESOLUTION,
                        top: Math.round(target.top! / RESOLUTION) * RESOLUTION,
                    })
                    .setCoords();
            }

            this.floor.canvas.renderAll();
        }
    };
}
