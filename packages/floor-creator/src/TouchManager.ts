import type { Canvas } from "fabric";

import { throttle } from "es-toolkit";
import { Point } from "fabric";
import { DIRECTION_ALL, Manager, Pan, Pinch, Tap } from "hammerjs";

import type { Floor } from "./Floor.js";

const DAMPENING_FACTOR = 0.2;
const PAN_DAMPENING_FACTOR = 0.1;

export class TouchManager {
    isInteracting = false;

    private readonly canvas: Canvas;
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
        this.canvas = floor.canvas;

        const upperCanvasEl = this.canvas.upperCanvasEl;
        this.hammerManager = new Manager(upperCanvasEl);

        // Create recognizers for pinch and pan gestures
        const doubleTap = new Tap({ event: "doubletap", taps: 2 });
        const pinch = new Pinch({ direction: DIRECTION_ALL, enable: true });
        const pan = new Pan({ direction: DIRECTION_ALL, threshold: 50 });

        this.hammerManager.add([pinch, pan, doubleTap]);

        this.hammerManager.on("pinch", this.onPinch);
        this.hammerManager.on("panmove", this.onPanMove);
        this.hammerManager.on("doubletap", this.onDoubleTap);
        this.hammerManager.on("pinchend pinchcancel panend", this.onGestureEnd);
    }

    destroy(): void {
        this.hammerManager.destroy();
        this.isInteracting = false;
    }

    onGestureEnd = (): void => {
        setTimeout(() => {
            this.isInteracting = false;
        }, 100);
    };

    onPanMove = (e: HammerInput): void => {
        const { canvas, floor } = this;
        this.isInteracting = true;
        // prevent panning if ctrl is pressed or drawing mode is active
        if (e.srcEvent.ctrlKey || canvas.isDrawingMode) {
            return;
        }
        // If an object is selected, don't pan the canvas
        if (canvas.getActiveObject()) {
            return;
        }

        const zoom = canvas.getZoom();
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const viewportWidth = floor.width * zoom;
        const viewportHeight = floor.height * zoom;

        const minX = canvasWidth - viewportWidth;
        const minY = canvasHeight - viewportHeight;

        const deltaX = e.deltaX * PAN_DAMPENING_FACTOR;
        const deltaY = e.deltaY * PAN_DAMPENING_FACTOR;

        // Calculate the new x and y values after the pan
        let newX = (canvas.viewportTransform ? canvas.viewportTransform[4] : 0) + deltaX;
        let newY = (canvas.viewportTransform ? canvas.viewportTransform[5] : 0) + deltaY;

        // Clamp the new x and y values to the boundaries
        newX = Math.min(0, Math.max(minX, newX));
        newY = Math.min(0, Math.max(minY, newY));

        canvas.setViewportTransform([zoom, 0, 0, zoom, newX, newY]);
    };

    private readonly onDoubleTap = (ev: HammerInput): void => {
        const { x, y } = this.canvas.getScenePoint(ev.srcEvent);
        this.floor.onFloorDoubleTap([x, y]);
    };
}
