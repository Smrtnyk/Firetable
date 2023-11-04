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

    // Define animation properties
    private animationDuration: number = 150; // Duration of the zoom animation in milliseconds
    private startTime?: number;
    private startZoom?: number;
    private targetZoom?: number;

    constructor(canvas: fabric.Canvas, initialScale: number, initialViewportTransform: number[]) {
        this.canvas = canvas;
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
        this.minZoom = this.initialScale;
    }

    zoomIn(point: fabric.Point): void {
        this.adjustZoom(ZOOM_INCREMENT, point);
    }

    zoomOut(point: fabric.Point): void {
        this.adjustZoom(-ZOOM_INCREMENT, point);
    }

    // Adjust the zoom level based on the increment/decrement factor and animate the zoom
    private adjustZoom(incrementFactor: number, point: fabric.Point): void {
        const newZoom = this.canvas.getZoom() + this.canvas.getZoom() * incrementFactor;
        if (newZoom <= this.maxZoom && newZoom >= this.minZoom) {
            this.animateZoom(newZoom, point);
        } else if (newZoom < this.minZoom) {
            this.resetZoom();
        }
    }

    private animateZoom(targetZoom: number, point: fabric.Point): void {
        this.startTime = undefined;
        this.startZoom = this.canvas.getZoom();
        this.targetZoom = targetZoom;

        const animateStep = (timestamp: number): void => {
            if (!this.startTime) {
                this.startTime = timestamp;
            }

            const elapsed = timestamp - this.startTime;
            const progress = easeInOutQuart(Math.min(elapsed / this.animationDuration, 1));
            const zoom = this.startZoom! + (this.targetZoom! - this.startZoom!) * progress;

            this.canvas.zoomToPoint(point, zoom);

            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                this.canvas.renderAll();
            }
        };

        requestAnimationFrame(animateStep);
    }

    zoomToPoint(point: fabric.Point, scaleFactor: number): void {
        let newZoom = this.canvas.getZoom() * scaleFactor;
        newZoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));
        this.canvas.zoomToPoint(point, newZoom);
        this.canvas.renderAll();
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
        this.canvas.renderAll();
    }
}
