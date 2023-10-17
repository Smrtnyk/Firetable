import { fabric } from "fabric";
import { Floor } from "./Floor";
import { MAX_ZOOM_STEPS } from "./constants";

export class TouchManager {
    private canvas: fabric.Canvas;
    private floor: Floor;
    private initialPinchDistance: number | null = null;
    private initialDragX: number | null = null;
    private initialDragY: number | null = null;

    constructor(canvas: fabric.Canvas, floor: Floor) {
        this.canvas = canvas;
        this.floor = floor;
    }

    onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            this.initialPinchDistance = this.getDistance(e.touches);
        } else if (e.touches.length === 1) {
            this.initialDragX = e.touches[0].clientX;
            this.initialDragY = e.touches[0].clientY;
        }
    };

    onTouchMove = (e: TouchEvent) => {
        const activeObject = this.canvas.getActiveObject();

        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }

        // Handle pinch to zoom
        if (e.touches.length === 2 && this.initialPinchDistance !== null) {
            const newDistance = this.getDistance(e.touches);
            const scale = newDistance / this.initialPinchDistance;

            const midpoint = new fabric.Point(
                (e.touches[0].clientX + e.touches[1].clientX) / 2,
                (e.touches[0].clientY + e.touches[1].clientY) / 2,
            );

            if (scale > 1 && this.floor.zoomManager.canZoomIn()) {
                this.floor.zoomIn(midpoint);
            } else if (scale < 1 && this.floor.zoomManager.canZoomOut()) {
                this.floor.zoomOut(midpoint);
            }

            // Update the initial distance for the next move.
            this.initialPinchDistance = newDistance;
        }
        // Handle single touch move for panning
        else if (
            e.touches.length === 1 &&
            this.initialDragX != undefined &&
            this.initialDragY != undefined
        ) {
            if (this.canvas.getZoom() === this.floor.initialScale) {
                return; // No panning if not zoomed in
            }

            const deltaX = e.touches[0].clientX - this.initialDragX;
            const deltaY = e.touches[0].clientY - this.initialDragY;

            const { newPosX, newPosY } = this.checkBoundaries(deltaX, deltaY);

            const viewportTransform = this.canvas.viewportTransform?.slice() || [1, 0, 0, 1, 0, 0];
            viewportTransform[4] = newPosX;
            viewportTransform[5] = newPosY;

            this.canvas.setViewportTransform(viewportTransform);
            this.canvas.requestRenderAll();

            this.initialDragX = e.touches[0].clientX;
            this.initialDragY = e.touches[0].clientY;
        }
    };

    onTouchEnd = () => {
        this.initialPinchDistance = null;
    };

    private getDistance(touches: TouchList): number {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2),
        );
    }

    checkBoundaries(deltaX: number, deltaY: number) {
        let newPosX =
            (this.canvas.viewportTransform ? this.canvas.viewportTransform[4] : 0) + deltaX;
        let newPosY =
            (this.canvas.viewportTransform ? this.canvas.viewportTransform[5] : 0) + deltaY;

        // Check boundaries for X
        if (newPosX > 0) {
            newPosX = 0;
        } else if (newPosX + this.floor.width * this.canvas.getZoom() < this.canvas.getWidth()) {
            newPosX = this.canvas.getWidth() - this.floor.width * this.canvas.getZoom();
        }

        // Check boundaries for Y
        if (newPosY > 0) {
            newPosY = 0;
        } else if (newPosY + this.floor.height * this.canvas.getZoom() < this.canvas.getHeight()) {
            newPosY = this.canvas.getHeight() - this.floor.height * this.canvas.getZoom();
        }

        return { newPosX, newPosY };
    }

    private handleZoomLogic = (opt: fabric.IEvent<WheelEvent>) => {
        if (!opt.e) {
            return;
        }

        const delta = opt.e.deltaY;
        let shouldReset = false;

        if (delta > 0 && this.floor.currentZoomSteps < MAX_ZOOM_STEPS) {
            this.floor.currentZoomSteps++;
            this.floor.zoomManager.performZoom(opt.e.offsetX, opt.e.offsetY);
        } else if (delta < 0 && this.floor.currentZoomSteps > 0) {
            this.floor.currentZoomSteps--;
            this.floor.zoomManager.performZoom(opt.e.offsetX, opt.e.offsetY);
            if (this.floor.currentZoomSteps <= 0) {
                shouldReset = true;
            }
        }

        if (shouldReset) {
            this.floor.zoomManager.resetZoom();
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };
}
