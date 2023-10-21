import { fabric } from "fabric";
import { Floor } from "./Floor";
import { NumberTuple } from "./types";
import { isFloorElement, isTable } from "./type-guards";
import { DEFAULT_COORDINATE, RESOLUTION } from "./constants";

import Hammer from "hammerjs";

export class EventManager {
    private readonly floor: Floor;
    private hammerManager!: HammerManager;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    initializeCanvasEventHandlers() {
        // @ts-ignore -- private prop
        const upperCanvasEl = this.floor.canvas.upperCanvasEl as HTMLElement;
        this.hammerManager = new Hammer(upperCanvasEl);
        this.floor.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.floor.canvas.on("mouse:wheel", this.onMouseWheelHandler);
        this.floor.canvas.on("object:scaling", this.onObjectScaling);

        this.hammerManager.on("pinch", (ev) => {
            const scale = ev.scale;

            const center = new fabric.Point(ev.center.x, ev.center.y);
            this.floor.zoomManager.zoomToPoint(center, scale);
        });

        this.hammerManager.on("panstart", (ev) => {
            this.floor.touchManager.onTouchStart(ev);
        });

        this.hammerManager.on("panmove", (ev) => {
            this.floor.touchManager.onTouchMove(ev);
        });

        this.hammerManager.on("panend", () => {
            this.floor.touchManager.onTouchEnd();
        });

        this.hammerManager.get("pinch").set({ enable: true });
        this.hammerManager.get("pan").set({ direction: Hammer.DIRECTION_ALL });

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
