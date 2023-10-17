import { fabric } from "fabric";
import { Floor } from "./Floor";

export class TouchManager {
    private floor: Floor;
    private initialPinchDistance: number | null = null;
    private initialDragX: number | null = null;
    private initialDragY: number | null = null;

    constructor(floor: Floor) {
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
        const activeObject = this.floor.canvas.getActiveObject();

        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }

        if (e.touches.length === 2 && this.initialPinchDistance != null) {
            this.handlePinchZoom(e);
        } else if (
            e.touches.length === 1 &&
            this.initialDragX != null &&
            this.initialDragY != null
        ) {
            this.handlePanning(e);
        }
    };

    private handlePinchZoom(e: TouchEvent) {
        const newDistance = this.getDistance(e.touches);
        const newMidpoint = this.getMidpoint(e.touches);
        const scaleChange = newDistance / this.initialPinchDistance!;

        this.handleZoomLogic(scaleChange, newMidpoint);

        // Update the initial distance for the next move.
        this.initialPinchDistance = newDistance;
    }

    private handlePanning(e: TouchEvent) {
        const deltaX = e.touches[0].clientX - this.initialDragX!;
        const deltaY = e.touches[0].clientY - this.initialDragY!;

        const { newPosX, newPosY } = this.checkBoundaries(deltaX, deltaY);

        const viewportTransform = this.floor.canvas.viewportTransform?.slice() || [
            1, 0, 0, 1, 0, 0,
        ];
        viewportTransform[4] = newPosX;
        viewportTransform[5] = newPosY;

        this.floor.canvas.setViewportTransform(viewportTransform);
        this.floor.canvas.requestRenderAll();

        this.initialDragX = e.touches[0].clientX;
        this.initialDragY = e.touches[0].clientY;
    }

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

    private getMidpoint(touches: TouchList): fabric.Point {
        const [touch1, touch2] = [touches[0], touches[1]];
        return new fabric.Point(
            (touch1.clientX + touch2.clientX) / 2,
            (touch1.clientY + touch2.clientY) / 2,
        );
    }

    private handleZoomLogic(scaleChange: number, midpoint: fabric.Point) {
        if (scaleChange > 1 && this.floor.zoomManager.canZoomIn()) {
            this.floor.zoomManager.zoomIn(midpoint);
        } else if (scaleChange < 1 && this.floor.zoomManager.canZoomOut()) {
            this.floor.zoomManager.zoomOut(midpoint);
        }
    }

    private checkBoundaries(deltaX: number, deltaY: number) {
        let newPosX =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
            deltaX;
        let newPosY =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
            deltaY;

        // Check boundaries for X
        if (newPosX > 0) {
            newPosX = 0;
        } else if (
            newPosX + this.floor.width * this.floor.canvas.getZoom() <
            this.floor.canvas.getWidth()
        ) {
            newPosX = this.floor.canvas.getWidth() - this.floor.width * this.floor.canvas.getZoom();
        }

        // Check boundaries for Y
        if (newPosY > 0) {
            newPosY = 0;
        } else if (
            newPosY + this.floor.height * this.floor.canvas.getZoom() <
            this.floor.canvas.getHeight()
        ) {
            newPosY =
                this.floor.canvas.getHeight() - this.floor.height * this.floor.canvas.getZoom();
        }

        return { newPosX, newPosY };
    }
}
