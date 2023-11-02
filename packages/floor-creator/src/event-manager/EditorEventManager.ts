import { EventManager } from "./EventManager";
import { fabric } from "fabric";
import { RESOLUTION } from "../constants";
import { Floor } from "../Floor";

export class EditorEventManager extends EventManager {
    constructor(floor: Floor) {
        super(floor);
    }

    initializeCanvasEventHandlers() {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("object:modified", this.snapToGridOnModify);
        this.floor.canvas.on("mouse:up", this.onEditorMouseUp);
    }

    private onEditorMouseUp = () => {
        const hasActiveElement = this.floor.canvas.getActiveObject();
        if (!hasActiveElement) {
            this.floor.emit("elementClicked", this.floor, void 0);
        }
    };

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
            const snapRange = 2; // pixels

            const leftRemainder = target.left! % RESOLUTION;
            const topRemainder = target.top! % RESOLUTION;

            const shouldSnapToLeft =
                leftRemainder <= snapRange || RESOLUTION - leftRemainder <= snapRange;
            const shouldSnapToTop =
                topRemainder <= snapRange || RESOLUTION - topRemainder <= snapRange;

            let newLeft: number | undefined;
            let newTop: number | undefined;

            if (shouldSnapToLeft) {
                newLeft =
                    leftRemainder <= snapRange
                        ? target.left! - leftRemainder
                        : target.left! + (RESOLUTION - leftRemainder);
            }

            if (shouldSnapToTop) {
                newTop =
                    topRemainder <= snapRange
                        ? target.top! - topRemainder
                        : target.top! + (RESOLUTION - topRemainder);
            }

            if (newLeft !== undefined || newTop !== undefined) {
                target
                    .set({
                        left: newLeft !== undefined ? newLeft : target.left,
                        top: newTop !== undefined ? newTop : target.top,
                    })
                    .setCoords();
            }

            this.floor.canvas.renderAll();
        }
    };
}
