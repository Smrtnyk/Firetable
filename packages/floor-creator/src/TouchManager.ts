import Hammer from "hammerjs";
import { Floor } from "./Floor";
import { FloorZoomManager } from "./FloorZoomManager";
import { fabric } from "fabric";

const VELOCITY_THRESHOLD = 0.01;
const FRICTION_DECREMENT = 0.01;
const BOUNCE_OFFSET = 20;
const DAMPENING_FACTOR = 0.05;
const PAN_DAMPENING_FACTOR = 0.3;

function clampValueWithinRange(value: number, min: number, max: number): number {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

export class TouchManager {
    private readonly floor: Floor;

    // For momentum-based panning
    private lastMoveTimestamp?: number;
    private lastMoveX?: number;
    private lastMoveY?: number;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private friction: number = 0.95; // Friction factor to reduce velocity
    private animationFrame?: number;

    private hammerManager: HammerManager;

    constructor(floor: Floor) {
        this.floor = floor;

        // @ts-ignore -- private prop
        const upperCanvasEl = this.floor.canvas.upperCanvasEl as HTMLElement;
        this.hammerManager = new Hammer(upperCanvasEl);

        // Enable pinch and set pan direction
        this.hammerManager.get("pinch").set({ enable: true });
        this.hammerManager.get("pan").set({ direction: Hammer.DIRECTION_ALL });

        // Pinch event
        this.hammerManager.on("pinch", this.onPinch);

        // Pan events
        this.hammerManager.on("panstart", this.onPanStart);
        this.hammerManager.on("panmove", this.onPanMove);
        this.hammerManager.on("panend", this.onPanEnd);

        this.hammerManager.on("doubletap", this.onDoubleTap);
    }

    private onDoubleTap = (ev: HammerInput) => {
        const { x, y } = this.extractEventCoordinates(ev);
        this.floor.dblClickHandler?.(this.floor, [x, y]);
    };

    private extractEventCoordinates(ev: HammerInput): { x: number; y: number } {
        // @ts-ignore -- private prop
        // Get the bounding rectangle of the canvas
        const boundingRect = this.floor.canvas.lowerCanvasEl.getBoundingClientRect();

        // Calculate the client-relative coordinates
        let x = ev.center.x - boundingRect.left;
        let y = ev.center.y - boundingRect.top;

        // Adjust for zoom and viewport position
        if (this.floor.canvas.viewportTransform) {
            const zoom = this.floor.canvas.getZoom();
            x = (x - this.floor.canvas.viewportTransform[4]) / zoom;
            y = (y - this.floor.canvas.viewportTransform[5]) / zoom;
        }

        return { x, y };
    }

    private onPinch = (ev: HammerInput) => {
        const scale = ev.scale;
        // Adjust the scale based on a dampening factor to control zoom sensitivity
        const adjustedScale = 1 + (scale - 1) * DAMPENING_FACTOR;
        const center = new fabric.Point(ev.center.x, ev.center.y);
        this.floor.zoomManager.zoomToPoint(center, adjustedScale);
    };

    private onPanStart = (ev: HammerInput) => {
        if (ev.pointers.length === 2) {
            this.floor.zoomManager.initialPinchDistance = FloorZoomManager.getDistance(ev.pointers);
        }

        // Reset momentum panning tracking values
        this.lastMoveTimestamp = undefined;
        this.lastMoveX = undefined;
        this.lastMoveY = undefined;
        this.velocityX = 0;
        this.velocityY = 0;
    };

    setViewportTransform(x: number, y: number) {
        const viewportTransform = this.floor.canvas.viewportTransform?.slice() || [
            1, 0, 0, 1, 0, 0,
        ];
        viewportTransform[4] = x;
        viewportTransform[5] = y;
        this.floor.canvas.setViewportTransform(viewportTransform);
    }

    onPanMove = (e: HammerInput) => {
        const activeObject = this.floor.canvas.getActiveObject();

        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }

        const deltaX = e.deltaX * PAN_DAMPENING_FACTOR;
        const deltaY = e.deltaY * PAN_DAMPENING_FACTOR;

        const { newPosX, newPosY } = this.checkBoundaries(deltaX, deltaY);
        this.setViewportTransform(newPosX, newPosY);
        this.floor.canvas.requestRenderAll();

        // For momentum-based panning
        const currentTimestamp = performance.now();
        if (this.lastMoveTimestamp && this.lastMoveX && this.lastMoveY) {
            const deltaTime = currentTimestamp - this.lastMoveTimestamp;
            this.velocityX = (e.center.x - this.lastMoveX) / deltaTime;
            this.velocityY = (e.center.y - this.lastMoveY) / deltaTime;
        }
        this.lastMoveTimestamp = currentTimestamp;
        this.lastMoveX = e.center.x;
        this.lastMoveY = e.center.y;
    };

    onPanEnd = () => {
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
            const newPosX =
                (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
                this.velocityX;
            const newPosY =
                (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
                this.velocityY;

            const { x, y } = this.applyBoundaries(newPosX, newPosY);
            this.setViewportTransform(x, y);
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

        newPosX = clampValueWithinRange(
            newPosX,
            -this.floor.width * this.floor.canvas.getZoom() + this.floor.canvas.getWidth(),
            BOUNCE_OFFSET,
        );
        newPosY = clampValueWithinRange(
            newPosY,
            -this.floor.height * this.floor.canvas.getZoom() + this.floor.canvas.getHeight(),
            BOUNCE_OFFSET,
        );

        return { newPosX, newPosY };
    }

    applyBoundaries(newPosX: number, newPosY: number): { x: number; y: number } {
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

        return { x: newPosX, y: newPosY };
    }
}
