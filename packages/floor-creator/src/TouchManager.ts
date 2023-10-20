import { Floor } from "./Floor";
import { FloorZoomManager } from "./FloorZoomManager";

const VELOCITY_THRESHOLD = 0.01;
const FRICTION_DECREMENT = 0.01;
const BOUNCE_OFFSET = 20;

function checkBoundary(value: number, min: number, max: number): number {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

export class TouchManager {
    private floor: Floor;
    private initialDragX?: number;
    private initialDragY?: number;
    private isPinching: boolean = false;

    // For momentum-based panning
    private lastMoveTimestamp?: number;
    private lastMoveX?: number;
    private lastMoveY?: number;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private friction: number = 0.95; // Friction factor to reduce velocity
    private animationFrame?: number;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            this.isPinching = true;
            this.floor.zoomManager.initialPinchDistance = FloorZoomManager.getDistance(e.touches);
        } else if (e.touches.length === 1) {
            this.initialDragX = e.touches[0].clientX;
            this.initialDragY = e.touches[0].clientY;
        }

        // Reset momentum panning tracking values
        this.lastMoveTimestamp = undefined;
        this.lastMoveX = undefined;
        this.lastMoveY = undefined;
        this.velocityX = 0;
        this.velocityY = 0;
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

        // For momentum-based panning
        const currentTimestamp = performance.now();
        if (this.lastMoveTimestamp && this.lastMoveX && this.lastMoveY) {
            const deltaTime = currentTimestamp - this.lastMoveTimestamp;
            this.velocityX = (e.touches[0].clientX - this.lastMoveX) / deltaTime;
            this.velocityY = (e.touches[0].clientY - this.lastMoveY) / deltaTime;
        }
        this.lastMoveTimestamp = currentTimestamp;
        this.lastMoveX = e.touches[0].clientX;
        this.lastMoveY = e.touches[0].clientY;
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

        // Start momentum-based panning
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animateMomentumPanning();
    };

    private animateMomentumPanning() {
        if (
            Math.abs(this.velocityX) > VELOCITY_THRESHOLD ||
            Math.abs(this.velocityY) > VELOCITY_THRESHOLD
        ) {
            // Calculate the new position without clamping
            let newPosX =
                (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
                this.velocityX;
            let newPosY =
                (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
                this.velocityY;

            // Check boundaries for X
            if (newPosX > 0) {
                newPosX = 0;
                this.velocityX = 0; // Stop motion in X direction
            } else if (
                newPosX + this.floor.width * this.floor.canvas.getZoom() <
                this.floor.canvas.getWidth()
            ) {
                newPosX =
                    this.floor.canvas.getWidth() - this.floor.width * this.floor.canvas.getZoom();
                this.velocityX = 0; // Stop motion in X direction
            }

            // Check boundaries for Y
            if (newPosY > 0) {
                newPosY = 0;
                this.velocityY = 0; // Stop motion in Y direction
            } else if (
                newPosY + this.floor.height * this.floor.canvas.getZoom() <
                this.floor.canvas.getHeight()
            ) {
                newPosY =
                    this.floor.canvas.getHeight() - this.floor.height * this.floor.canvas.getZoom();
                this.velocityY = 0; // Stop motion in Y direction
            }

            const viewportTransform = this.floor.canvas.viewportTransform?.slice() || [
                1, 0, 0, 1, 0, 0,
            ];
            viewportTransform[4] = newPosX;
            viewportTransform[5] = newPosY;

            this.floor.canvas.setViewportTransform(viewportTransform);
            this.floor.canvas.requestRenderAll();

            this.velocityX *= this.friction - FRICTION_DECREMENT;
            this.velocityY *= this.friction - FRICTION_DECREMENT;

            this.animationFrame = requestAnimationFrame(this.animateMomentumPanning.bind(this));
        } else {
            this.floor.canvas.requestRenderAll();
        }
    }

    checkBoundaries(deltaX: number, deltaY: number) {
        let newPosX =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
            deltaX;
        let newPosY =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
            deltaY;

        newPosX = checkBoundary(
            newPosX,
            -this.floor.width * this.floor.canvas.getZoom() + this.floor.canvas.getWidth(),
            BOUNCE_OFFSET,
        );
        newPosY = checkBoundary(
            newPosY,
            -this.floor.height * this.floor.canvas.getZoom() + this.floor.canvas.getHeight(),
            BOUNCE_OFFSET,
        );

        return { newPosX, newPosY };
    }
}
