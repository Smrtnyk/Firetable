import { fabric } from "fabric";
import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

export class FloorZoomManager {
    private canvas: fabric.Canvas;
    private readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    readonly maxZoom: number = DEFAULT_ZOOM * 3; // 3 times the default zoom
    readonly minZoom: number;

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
}
