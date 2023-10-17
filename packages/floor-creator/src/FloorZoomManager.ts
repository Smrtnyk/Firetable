import { fabric } from "fabric";
import { DEFAULT_ZOOM, MAX_ZOOM_STEPS, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    private canvas: fabric.Canvas;
    private readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    currentZoomSteps: number = 0;
    private maxZoomSteps: number = MAX_ZOOM_STEPS;

    constructor(canvas: fabric.Canvas, initialScale: number, initialViewportTransform: number[]) {
        this.canvas = canvas;
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
    }

    zoomIn(point: fabric.Point) {
        if (this.currentZoomSteps < this.maxZoomSteps) {
            this.currentZoomSteps++;
            this.performZoom(point.x, point.y);
        }
    }

    zoomOut(point: fabric.Point) {
        if (this.currentZoomSteps > 0) {
            this.currentZoomSteps--;
            this.performZoom(point.x, point.y);
            if (this.currentZoomSteps <= 0) {
                this.resetZoom();
            }
        }
    }

    canZoomIn(): boolean {
        return this.currentZoomSteps < this.maxZoomSteps;
    }

    canZoomOut(): boolean {
        return this.currentZoomSteps > 0;
    }

    resetZoom() {
        this.canvas.setViewportTransform([...this.initialViewportTransform]);
        this.canvas.setZoom(this.initialScale);
        this.canvas.renderAll();
    }

    performZoom(offsetX: number, offsetY: number) {
        const newZoom = DEFAULT_ZOOM + this.currentZoomSteps * ZOOM_INCREMENT;

        // Prevent over-zooming out
        if (newZoom < this.initialScale) {
            this.resetZoom();
            return;
        }

        this.canvas.zoomToPoint(new fabric.Point(offsetX, offsetY), newZoom);
        this.canvas.renderAll();
    }
}
