import type { Floor } from "./Floor.js";
import { Manager, Pinch, Pan, Tap, DIRECTION_ALL } from "hammerjs";
import { Point } from "fabric";
import { throttle } from "es-toolkit";

const DAMPENING_FACTOR = 0.2;
const PAN_DAMPENING_FACTOR = 0.1;

export class TouchManager {
    isInteracting = false;

    private readonly floor: Floor;
    private readonly hammerManager: HammerManager;
    private readonly onPinch = throttle((ev: HammerInput) => {
        this.isInteracting = true;
        const scale = ev.scale;
        // Adjust the scale based on a dampening factor to control zoom sensitivity
        const adjustedScale = 1 + (scale - 1) * DAMPENING_FACTOR;
        const center = new Point(ev.center.x, ev.center.y);
        this.floor.zoomManager.adjustZoom(adjustedScale, center);
    }, 100);

    constructor(floor: Floor) {
        this.floor = floor;

        const upperCanvasEl = this.floor.canvas.upperCanvasEl;
        this.hammerManager = new Manager(upperCanvasEl);

        // Create recognizers for pinch and pan gestures
        const doubleTap = new Tap({ event: "doubletap", taps: 2 });
        const pinch = new Pinch({ enable: true, direction: DIRECTION_ALL });
        const pan = new Pan({ direction: DIRECTION_ALL, threshold: 50 });

        // Add the recognizers to the hammerManager instance
        this.hammerManager.add([pinch, pan, doubleTap]);

        this.hammerManager.on("pinch", this.onPinch);
        this.hammerManager.on("panmove", this.onPanMove);
        this.hammerManager.on("doubletap", this.onDoubleTap);
        this.hammerManager.on("pinchend pinchcancel panend", this.onGestureEnd);
    }

    onPanMove = (e: HammerInput): void => {
        this.isInteracting = true;
        // prevent panning if ctrl is pressed
        if (e.srcEvent.ctrlKey) {
            return;
        }
        const activeObject = this.floor.canvas.getActiveObject();
        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }

        const zoom = this.floor.canvas.getZoom();
        const canvasWidth = this.floor.canvas.getWidth();
        const canvasHeight = this.floor.canvas.getHeight();
        const viewportWidth = this.floor.width * zoom;
        const viewportHeight = this.floor.height * zoom;

        const minX = canvasWidth - viewportWidth;
        const minY = canvasHeight - viewportHeight;

        const deltaX = e.deltaX * PAN_DAMPENING_FACTOR;
        const deltaY = e.deltaY * PAN_DAMPENING_FACTOR;

        // Calculate the new x and y values after the pan
        let newX =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
            deltaX;
        let newY =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
            deltaY;

        // Clamp the new x and y values to the boundaries
        newX = Math.min(0, Math.max(minX, newX));
        newY = Math.min(0, Math.max(minY, newY));

        this.floor.canvas.setViewportTransform([zoom, 0, 0, zoom, newX, newY]);
    };

    destroy(): void {
        this.hammerManager.destroy();
        this.isInteracting = false;
    }

    onGestureEnd = (): void => {
        setTimeout(() => {
            this.isInteracting = false;
        }, 100);
    };

    private readonly onDoubleTap = (ev: HammerInput): void => {
        const { x, y } = this.floor.canvas.getScenePoint(ev.srcEvent);
        this.floor.onFloorDoubleTap([x, y]);
    };
}
