import type { Canvas, Point } from "fabric";
import type { Floor } from "./Floor.js";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    isZooming = false;

    private minZoom: number;
    private readonly maxZoom = DEFAULT_ZOOM * 3;

    constructor(
        private readonly floor: Floor,
        private readonly canvas: Canvas,
        private initialScale: number,
    ) {
        this.minZoom = this.initialScale;
    }

    setScale(newVal: number): void {
        this.initialScale = newVal;
        this.minZoom = this.initialScale;
    }

    zoomIn(point: Point): void {
        this.adjustZoom(1 + ZOOM_INCREMENT, point);
    }

    zoomOut(point: Point): void {
        this.adjustZoom(1 - ZOOM_INCREMENT, point);
    }

    adjustZoom(scaleFactor: number, point: Point): void {
        let newZoom = this.canvas.getZoom() * scaleFactor;
        if (newZoom > this.maxZoom) {
            newZoom = this.maxZoom;
        }
        if (newZoom < this.minZoom) {
            newZoom = this.minZoom;
        }
        this.isZooming = true;
        this.canvas.zoomToPoint(point, newZoom);
        const canvas = this.canvas;
        const vpt = this.canvas.viewportTransform;
        if (newZoom < 400 / 1000) {
            vpt[4] = 200 - (1000 * newZoom) / 2;
            vpt[5] = 200 - (1000 * newZoom) / 2;
        } else {
            if (vpt[4] >= 0) {
                vpt[4] = 0;
            } else if (vpt[4] < canvas.getWidth() - this.floor.width * newZoom) {
                vpt[4] = canvas.getWidth() - this.floor.width * newZoom;
            }
            if (vpt[5] >= 0) {
                vpt[5] = 0;
            } else if (vpt[5] < canvas.getHeight() - this.floor.height * newZoom) {
                vpt[5] = canvas.getHeight() - this.floor.height * newZoom;
            }
        }
        this.floor.setObjectCoords();
        this.isZooming = false;
    }

    destroy(): void {
        this.isZooming = false;
    }
}
