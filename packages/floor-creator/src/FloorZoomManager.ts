import { fabric } from "fabric";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    private canvas: fabric.Canvas;
    private initialScale: number;
    private initialViewportTransform: number[];
    readonly maxZoom: number = DEFAULT_ZOOM * 3; // 3 times the default zoom
    minZoom: number;

    private pinchZoomScale: number | null = null;
    private pinchZoomPoint: fabric.Point | null = null;

    private zoomDelta = 0;
    private zoomPoint: fabric.Point | null = null;
    // Define animation properties
    private startTime?: number;
    private startZoom?: number;
    private targetZoom?: number;

    private centerPoint: fabric.Point;

    constructor(canvas: fabric.Canvas, initialScale: number, initialViewportTransform: number[]) {
        this.canvas = canvas;
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
        this.minZoom = this.initialScale;

        this.centerPoint = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    }

    setScale(newVal: number): void {
        this.initialScale = newVal;
        this.minZoom = this.initialScale;
        this.centerPoint = new fabric.Point(
            this.canvas.getWidth() / 2,
            this.canvas.getHeight() / 2,
        );
    }

    setInitialViewportTransform(newVal: number[]): void {
        this.initialViewportTransform = newVal;
    }

    zoomIn(point: fabric.Point): void {
        this.adjustZoom(1 + ZOOM_INCREMENT, point);
    }

    zoomOut(point: fabric.Point): void {
        this.adjustZoom(1 - ZOOM_INCREMENT, point);
    }

    private update(): void {
        // Apply zoom changes if there are any
        if (this.zoomDelta !== 0 && this.zoomPoint) {
            const newZoom = this.canvas.getZoom() * (1 + this.zoomDelta);
            this.canvas.zoomToPoint(this.zoomPoint, newZoom);
            // Reset the stored state after applying
            this.zoomDelta = 0;
            this.zoomPoint = null;
        }

        // Apply pinch zoom changes if there are any
        if (this.pinchZoomScale !== null && this.pinchZoomPoint !== null) {
            this.applyPinchZoom();
        }

        // Handle ongoing animation for smooth zooming
        if (
            this.targetZoom !== undefined &&
            this.startZoom !== undefined &&
            this.startTime !== undefined
        ) {
            const zoom = this.startZoom + (this.targetZoom - this.startZoom);
            const point = this.getCenterPoint();

            this.canvas.zoomToPoint(point, zoom);
            this.startZoom = undefined;
            this.targetZoom = undefined;
        }

        this.canvas.requestRenderAll();
    }

    private getCenterPoint(): fabric.Point {
        this.centerPoint.x = this.canvas.getWidth() / 2;
        this.centerPoint.y = this.canvas.getHeight() / 2;
        return this.centerPoint;
    }

    adjustZoom(scaleFactor: number, point: fabric.Point): void {
        const newZoom = this.canvas.getZoom() * scaleFactor;
        if (newZoom <= this.maxZoom && newZoom >= this.minZoom) {
            // Set the animation start properties
            this.startTime = performance.now();
            this.startZoom = this.canvas.getZoom();
            this.targetZoom = newZoom;
            this.zoomPoint = point; // Use the current point as the zoom focal point

            this.update();
        } else if (newZoom < this.minZoom) {
            this.resetZoom();
        }
    }

    private applyPinchZoom(): void {
        if (this.pinchZoomScale !== null && this.pinchZoomPoint !== null) {
            const newZoom = this.canvas.getZoom() * this.pinchZoomScale;
            this.zoomToPoint(this.pinchZoomPoint, newZoom);
            this.pinchZoomScale = null;
            this.pinchZoomPoint = null;
        }
    }

    private zoomToPoint(point: fabric.Point, scaleFactor: number): void {
        let newZoom = this.canvas.getZoom() * scaleFactor;
        newZoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));
        this.canvas.zoomToPoint(point, newZoom);
    }

    canZoomIn(): boolean {
        return this.canvas.getZoom() < this.maxZoom;
    }

    canZoomOut(): boolean {
        return this.canvas.getZoom() > this.minZoom;
    }

    resetZoom(): void {
        this.canvas.setViewportTransform([...this.initialViewportTransform]);
        this.canvas.setZoom(this.initialScale);
        this.canvas.requestRenderAll();
    }

    destroy(): void {}
}
