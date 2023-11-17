import { fabric } from "fabric";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    private minZoom: number;
    private readonly maxZoom: number = DEFAULT_ZOOM * 3;

    private rafId: number | undefined;

    constructor(
        private canvas: fabric.Canvas,
        private initialScale: number,
        private initialViewportTransform: number[],
    ) {
        this.initialScale = initialScale;
        this.initialViewportTransform = initialViewportTransform;
        this.minZoom = this.initialScale;
    }

    setScale(newVal: number): void {
        this.initialScale = newVal;
        this.minZoom = this.initialScale;
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

    adjustZoom(scaleFactor: number, point: fabric.Point): void {
        const newZoom = this.canvas.getZoom() * scaleFactor;
        if (newZoom <= this.maxZoom && newZoom >= this.minZoom) {
            this.cancelCurrentAnimation();
            this.rafId = requestAnimationFrame(() => {
                this.canvas.zoomToPoint(point, newZoom);
                this.canvas.requestRenderAll();
            });
        } else if (newZoom < this.minZoom) {
            this.cancelCurrentAnimation();
            this.rafId = requestAnimationFrame(() => {
                this.resetZoom();
            });
        }
    }

    canZoomIn(): boolean {
        return this.canvas.getZoom() < this.maxZoom;
    }

    canZoomOut(): boolean {
        return this.canvas.getZoom() > this.minZoom;
    }

    private resetZoom(): void {
        this.canvas.setViewportTransform([...this.initialViewportTransform]);
        this.canvas.setZoom(this.initialScale);
        this.canvas.requestRenderAll();
    }

    private cancelCurrentAnimation(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    destroy(): void {
        this.cancelCurrentAnimation();
    }
}
