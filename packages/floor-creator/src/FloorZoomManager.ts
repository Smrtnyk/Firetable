import type { Canvas } from "fabric";

import { Point } from "fabric";

import type { Floor } from "./Floor.js";

import { DEFAULT_ZOOM, ZOOM_INCREMENT } from "./constants.js";

enum AbsoluteScale {
    NO = 1,
    YES = 0,
}

export class FloorZoomManager {
    isZooming = false;

    private readonly canvas: Canvas;
    private initialScale: number;
    private readonly maxZoom = DEFAULT_ZOOM * 3;
    private minZoom: number;

    constructor(private readonly floor: Floor) {
        this.canvas = floor.canvas;
        this.initialScale = this.canvas.getZoom();
        this.minZoom = this.initialScale;
    }

    adjustZoom(scale: number, point: Point, isAbsolute = AbsoluteScale.NO): void {
        const { canvas, floor, maxZoom, minZoom } = this;
        let newZoom = isAbsolute === AbsoluteScale.YES ? scale : canvas.getZoom() * scale;
        if (newZoom > maxZoom) {
            newZoom = maxZoom;
        }
        if (newZoom < minZoom) {
            newZoom = minZoom;
        }
        this.isZooming = true;
        canvas.zoomToPoint(point, newZoom);
        const vpt = canvas.viewportTransform;
        if (newZoom < 400 / 1000) {
            vpt[4] = 200 - (1000 * newZoom) / 2;
            vpt[5] = 200 - (1000 * newZoom) / 2;
        } else {
            if (vpt[4] >= 0) {
                vpt[4] = 0;
            } else if (vpt[4] < canvas.getWidth() - floor.width * newZoom) {
                vpt[4] = canvas.getWidth() - floor.width * newZoom;
            }
            if (vpt[5] >= 0) {
                vpt[5] = 0;
            } else if (vpt[5] < canvas.getHeight() - floor.height * newZoom) {
                vpt[5] = canvas.getHeight() - floor.height * newZoom;
            }
        }
        floor.setObjectCoords();
        this.isZooming = false;
    }

    destroy(): void {
        this.isZooming = false;
    }

    resetZoom(): void {
        this.adjustZoom(this.minZoom, new Point(0, 0), AbsoluteScale.YES);
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
}
