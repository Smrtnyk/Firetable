import Hammer from "hammerjs";
import { Floor } from "./Floor";
import { fabric } from "fabric";

const DAMPENING_FACTOR = 0.05;
const PAN_DAMPENING_FACTOR = 0.1;

export class TouchManager {
    private readonly floor: Floor;

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
        this.hammerManager.on("panmove", this.onPanMove);

        this.hammerManager.on("doubletap", this.onDoubleTap);
    }

    private onDoubleTap = (ev: HammerInput) => {
        const { x, y } = this.extractEventCoordinates(ev);
        this.floor.onFloorDoubleTap([x, y]);
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

    setViewportTransform(x: number, y: number) {
        const viewportTransform = this.floor.canvas.viewportTransform?.slice() || [
            1, 0, 0, 1, 0, 0,
        ];
        viewportTransform[4] = x;
        viewportTransform[5] = y;
        this.floor.canvas.setViewportTransform(viewportTransform);
    }

    onPanMove = (e: HammerInput) => {
        // prevent panning if ctrl is pressed
        if (e.srcEvent.ctrlKey) {
            return;
        }
        const activeObject = this.floor.canvas.getActiveObject();
        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }

        const zoom = this.floor.canvas.getZoom();
        const canvasWidth = this.floor.canvas.getWidth();
        const canvasHeight = this.floor.canvas.getHeight();
        const viewportWidth = this.floor.width * zoom;
        const viewportHeight = this.floor.height * zoom;

        const minX = canvasWidth - viewportWidth;
        const minY = canvasHeight - viewportHeight;

        const deltaX = e.deltaX * PAN_DAMPENING_FACTOR;
        const deltaY = e.deltaY * PAN_DAMPENING_FACTOR;

        // Calculate the new x and y values after the pan
        let newX =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[4] : 0) +
            deltaX;
        let newY =
            (this.floor.canvas.viewportTransform ? this.floor.canvas.viewportTransform[5] : 0) +
            deltaY;

        // Clamp the new x and y values to the boundaries
        newX = Math.min(0, Math.max(minX, newX));
        newY = Math.min(0, Math.max(minY, newY));

        this.floor.canvas.setViewportTransform([zoom, 0, 0, zoom, newX, newY]);
        this.floor.canvas.requestRenderAll();
    };
}
