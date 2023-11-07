import { fabric } from "fabric";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

function easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export class FloorZoomManager {
    private canvas: fabric.Canvas;
    private readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    readonly maxZoom: number = DEFAULT_ZOOM * 3; // 3 times the default zoom
    readonly minZoom: number;

    private pinchZoomScale: number | null = null;
    private pinchZoomPoint: fabric.Point | null = null;

    private zoomDelta = 0;
    private zoomPoint: fabric.Point | null = null;
    // Define animation properties
    private animationDuration: number = 20; // Duration of the zoom animation in milliseconds
    private startTime?: number;
    private startZoom?: number;
    private targetZoom?: number;

    private animationFrameId?: number;
    public isAnimating: boolean = false;

    constructor(canvas: fabric.Canvas, initialScale: number, initialViewportTransform: number[]) {
        this.canvas = canvas;
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
        this.minZoom = this.initialScale;

        requestAnimationFrame(() => this.update());
    }

    zoomIn(point: fabric.Point): void {
        this.adjustZoom(1 + ZOOM_INCREMENT, point);
    }

    zoomOut(point: fabric.Point): void {
        this.adjustZoom(1 - ZOOM_INCREMENT, point);
    }

    private update(): void {
        let needsRender = false;

        // Apply zoom changes if there are any
        if (this.zoomDelta !== 0 && this.zoomPoint) {
            const newZoom = this.canvas.getZoom() * (1 + this.zoomDelta);
            this.canvas.zoomToPoint(this.zoomPoint, newZoom);
            // Reset the stored state after applying
            this.zoomDelta = 0;
            this.zoomPoint = null;
            needsRender = true; // Mark that the canvas needs re-rendering
        }

        // Apply pinch zoom changes if there are any
        if (this.pinchZoomScale !== null && this.pinchZoomPoint !== null) {
            this.applyPinchZoom();
            needsRender = true;
        }

        // Handle ongoing animation for smooth zooming
        if (
            this.targetZoom !== undefined &&
            this.startZoom !== undefined &&
            this.startTime !== undefined
        ) {
            const timestamp = performance.now();
            const elapsed = timestamp - this.startTime;
            const progress = easeInOutQuart(Math.min(elapsed / this.animationDuration, 1));
            const zoom = this.startZoom + (this.targetZoom - this.startZoom) * progress;
            const point = this.getCenterPoint();

            this.canvas.zoomToPoint(point, zoom);
            needsRender = true;

            // If the animation duration has elapsed, reset the animation state
            if (elapsed >= this.animationDuration) {
                this.startZoom = undefined;
                this.targetZoom = undefined;
                this.startTime = undefined;
                this.isAnimating = false; // Animation is complete, no need to continue the loop
            }
        }

        // Only re-render the canvas if needed
        if (needsRender) {
            this.canvas.requestRenderAll();
        }

        // Continue the update loop only if needed
        if (this.isAnimating) {
            requestAnimationFrame(() => this.update());
        } else {
            this.animationFrameId = undefined; // Clear the animation frame id
            this.isAnimating = false; // Ensure the loop knows to stop
        }
    }

    private getCenterPoint(): fabric.Point {
        return new fabric.Point(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
    }

    adjustZoom(scaleFactor: number, point: fabric.Point): void {
        const newZoom = this.canvas.getZoom() * scaleFactor;
        if (newZoom <= this.maxZoom && newZoom >= this.minZoom) {
            // Set the animation start properties
            this.startTime = performance.now();
            this.startZoom = this.canvas.getZoom();
            this.targetZoom = newZoom;
            this.zoomPoint = point; // Use the current point as the zoom focal point
            this.isAnimating = true; // Start animating

            // If we're not already in an animation frame loop, start one
            if (this.animationFrameId === undefined) {
                this.animationFrameId = requestAnimationFrame(() => this.update());
            }
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
        this.cancelAnimation();
    }

    public cancelAnimation(): void {
        if (this.animationFrameId !== undefined) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
            this.isAnimating = false;
        }
    }
}
