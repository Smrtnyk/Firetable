import { fabric } from "fabric";
import { Floor } from "./Floor";
import { NumberTuple } from "./types";
import { isFloorElement, isTable } from "./type-guards";
import { DEFAULT_COORDINATE, RESOLUTION } from "./constants";

export class EventManager {
    private readonly floor: Floor;
    private isDragging: boolean = false;
    private lastPosX: number = 0;
    private lastPosY: number = 0;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    initializeCanvasEventHandlers() {
        this.floor.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.floor.canvas.on("mouse:wheel", this.onMouseWheelHandler);
        this.floor.canvas.on("object:scaling", this.onObjectScaling);

        this.floor.canvas.on("mouse:down", this.onMouseDownHandler);
        this.floor.canvas.on("mouse:move", this.onMouseMoveHandler);
        this.floor.canvas.on("mouse:up", this.onMouseUpHandler);

        // @ts-ignore -- private prop
        const upperCanvasEl = this.floor.canvas.upperCanvasEl as HTMLElement;
        upperCanvasEl.addEventListener("touchstart", this.floor.touchManager.onTouchStart, {
            passive: true,
        });
        upperCanvasEl.addEventListener("touchmove", this.floor.touchManager.onTouchMove, {
            passive: true,
        });
        upperCanvasEl.addEventListener("touchend", this.floor.touchManager.onTouchEnd, {
            passive: true,
        });

        this.floor.canvas.on("object:modified", this.onObjectModified);
    }

    private onObjectModified = (e: fabric.IEvent) => {
        const target = e.target;

        if (target) {
            // Snapping logic for rotation
            const snapAngle = 45; // 45 degrees
            const threshold = 5; // degrees
            const closestMultipleOfSnap = Math.round(target.angle! / snapAngle) * snapAngle;
            const differenceFromSnap = Math.abs(target.angle! - closestMultipleOfSnap);
            if (differenceFromSnap <= threshold) {
                target.set("angle", closestMultipleOfSnap).setCoords();
            }

            // Snapping logic for movement
            const shouldSnapToGrid =
                Math.round((target.left! / RESOLUTION) * 4) % 4 === 0 &&
                Math.round((target.top! / RESOLUTION) * 4) % 4 === 0;
            if (shouldSnapToGrid) {
                target
                    .set({
                        left: Math.round(target.left! / RESOLUTION) * RESOLUTION,
                        top: Math.round(target.top! / RESOLUTION) * RESOLUTION,
                    })
                    .setCoords();
            }

            this.floor.canvas.renderAll();
        }
    };

    onMouseDownHandler = (opt: fabric.IEvent<MouseEvent>) => {
        const activeObject = this.floor.canvas.getActiveObject();

        // If an object is selected, don't start panning
        if (activeObject) {
            return;
        }

        if (this.floor.zoomManager.canZoomOut()) {
            // Only allow panning when zoomed in
            this.isDragging = true;
            this.lastPosX = opt.e.clientX;
            this.lastPosY = opt.e.clientY;
            this.floor.canvas.defaultCursor = "move";
        }
    };

    onMouseMoveHandler = (opt: fabric.IEvent<MouseEvent>) => {
        if (this.isDragging && opt.e.clientX && opt.e.clientY) {
            const deltaX = opt.e.clientX - this.lastPosX;
            const deltaY = opt.e.clientY - this.lastPosY;

            const { newPosX, newPosY } = this.floor.touchManager.checkBoundaries(deltaX, deltaY); // Reusing existing method

            const viewportTransform = this.floor.canvas.viewportTransform?.slice() || [
                1, 0, 0, 1, 0, 0,
            ];
            viewportTransform[4] = newPosX;
            viewportTransform[5] = newPosY;

            this.floor.canvas.setViewportTransform(viewportTransform);
            this.floor.canvas.requestRenderAll();

            this.lastPosX = opt.e.clientX;
            this.lastPosY = opt.e.clientY;
        }
    };

    onMouseUpHandler = () => {
        this.isDragging = false;
        this.floor.canvas.defaultCursor = "default"; // Reset cursor
    };

    // Check if double click was on the actual table
    // if it is, then do nothing, but if it is not
    // then invoke the handler
    private onDblClickHandler = (ev: fabric.IEvent) => {
        if (isFloorElement(ev.target)) return;
        const coords: NumberTuple = [
            ev.pointer?.x || DEFAULT_COORDINATE,
            ev.pointer?.y || DEFAULT_COORDINATE,
        ];
        this.floor.dblClickHandler?.(this.floor, coords);
    };

    private onMouseWheelHandler = (opt: fabric.IEvent<WheelEvent>) => {
        if (!opt.e) {
            return;
        }

        const delta = opt.e.deltaY;

        if (delta > 0 && this.floor.zoomManager.canZoomIn()) {
            this.floor.zoomManager.zoomIn(new fabric.Point(opt.e.offsetX, opt.e.offsetY));
        } else if (delta < 0 && this.floor.zoomManager.canZoomOut()) {
            this.floor.zoomManager.zoomOut(new fabric.Point(opt.e.offsetX, opt.e.offsetY));
            if (!this.floor.zoomManager.canZoomOut()) {
                this.floor.zoomManager.resetZoom();
            }
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };

    private onObjectScaling = (e: fabric.IEvent) => {
        if (!isTable(e.target)) return;
        this.floor.elementClickHandler(this.floor, e.target);
    };
}
