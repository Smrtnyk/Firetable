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
            this.animateZoom(newZoom, point);
        }
    }

    zoomOut(point: fabric.Point) {
        const newZoom = this.canvas.getZoom() - this.canvas.getZoom() * ZOOM_INCREMENT;
        if (newZoom >= this.minZoom) {
            this.animateZoom(newZoom, point);
        } else {
            this.resetZoom();
        }
    }

    private animateZoom(targetZoom: number, point: fabric.Point) {
        this.startTime = undefined;
        this.startZoom = this.canvas.getZoom();
        this.targetZoom = targetZoom;

        const animateStep = (timestamp: number) => {
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
        const newDistance = FloorZoomManager.getDistance(e.touches);
        const newMidpoint = FloorZoomManager.getMidpoint(e.touches);
        let scaleChange = newDistance / this.initialPinchDistance!;

        // Reduce the scale change effect for slower zoom
        scaleChange = 1 + (scaleChange - 1) * 2.5;

        this.handleZoomLogic(scaleChange, newMidpoint);

        // Update the initial distance for the next move.
        this.initialPinchDistance = newDistance;
    }

    static getDistance(touches: TouchList): number {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2),
        );
    }

    static getMidpoint(touches: TouchList): fabric.Point {
        const [touch1, touch2] = [touches[0], touches[1]];
        return new fabric.Point(
            (touch1.clientX + touch2.clientX) / 2,
            (touch1.clientY + touch2.clientY) / 2,
        );
    }

    private handleZoomLogic(scaleChange: number, midpoint: fabric.Point) {
        const zoomFactor = this.canvas.getZoom() * scaleChange;
        let newZoom = this.canvas.getZoom() + (zoomFactor - this.canvas.getZoom()) * 0.1;

        newZoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));

        this.canvas.zoomToPoint(midpoint, newZoom);
    }
}
