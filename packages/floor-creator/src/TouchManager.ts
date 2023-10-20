import { Floor } from "./Floor";

export class TouchManager {
    private floor: Floor;
    private initialDragX?: number;
    private initialDragY?: number;
    private isPinching: boolean = false;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            this.isPinching = true;
            this.floor.zoomManager.initialPinchDistance = this.floor.zoomManager.getDistance(
                e.touches,
            );
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

        if (this.isPinching) {
            this.floor.zoomManager.handlePinchZoom(e);
        } else if (
            e.touches.length === 1 &&
            this.initialDragX != null &&
            this.initialDragY != null
        ) {
            this.handlePanning(e);
        }
    };

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
        this.isPinching = false;
        this.floor.zoomManager.initialPinchDistance = undefined;
    };

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
