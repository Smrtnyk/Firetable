import { fabric } from "fabric";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    private canvas: fabric.Canvas;
    private readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    readonly maxZoom: number = DEFAULT_ZOOM * 3; // 3 times the default zoom
    readonly minZoom: number;

    initialPinchDistance?: number;

    constructor(canvas: fabric.Canvas, initialScale: number, initialViewportTransform: number[]) {
        this.canvas = canvas;
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
        this.minZoom = this.initialScale;
    }

    zoomIn(point: fabric.Point) {
        const newZoom = this.canvas.getZoom() + this.canvas.getZoom() * ZOOM_INCREMENT;
        if (newZoom <= this.maxZoom) {
            this.canvas.zoomToPoint(new fabric.Point(point.x, point.y), newZoom);
            this.canvas.renderAll();
        }
    }

    zoomOut(point: fabric.Point) {
        const newZoom = this.canvas.getZoom() - this.canvas.getZoom() * ZOOM_INCREMENT;
        if (newZoom >= this.minZoom) {
            this.canvas.zoomToPoint(new fabric.Point(point.x, point.y), newZoom);
            this.canvas.renderAll();
        } else {
            this.resetZoom();
        }
    }

    canZoomIn(): boolean {
        return this.canvas.getZoom() < this.maxZoom;
    }

    canZoomOut(): boolean {
        return this.canvas.getZoom() > this.minZoom;
    }

    resetZoom() {
        this.canvas.setViewportTransform([...this.initialViewportTransform]);
        this.canvas.setZoom(this.initialScale);
        this.canvas.renderAll();
    }

    handlePinchZoom(e: TouchEvent) {
        const newDistance = this.getDistance(e.touches);
        const newMidpoint = this.getMidpoint(e.touches);
        let scaleChange = newDistance / this.initialPinchDistance!;

        // Reduce the scale change effect for slower zoom
        scaleChange = 1 + (scaleChange - 1) * 0.8; // Adjust the multiplier (0.5) to control zoom speed

        this.handleZoomLogic(scaleChange, newMidpoint);

        // Update the initial distance for the next move.
        this.initialPinchDistance = newDistance;
    }

    getDistance(touches: TouchList): number {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2),
        );
    }

    private getMidpoint(touches: TouchList): fabric.Point {
        const [touch1, touch2] = [touches[0], touches[1]];
        return new fabric.Point(
            (touch1.clientX + touch2.clientX) / 2,
            (touch1.clientY + touch2.clientY) / 2,
        );
    }

    private handleZoomLogic(scaleChange: number, midpoint: fabric.Point) {
        const zoomFactor = this.canvas.getZoom() * scaleChange;
        let newZoom = this.canvas.getZoom() + (zoomFactor - this.canvas.getZoom()) * 0.1;

        // Clamp the zoom level between minZoom and maxZoom
        newZoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));

        this.canvas.zoomToPoint(midpoint, newZoom);
    }
}
