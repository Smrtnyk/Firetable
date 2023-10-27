import { fabric } from "fabric";
import { Floor } from "../Floor";
import { BaseTable, FloorMode } from "../types";
import { isTable } from "../type-guards";

export abstract class EventManager {
    protected readonly floor: Floor;
    private startElement: BaseTable | null = null;
    hasMouseMoved: boolean = false;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    initializeCanvasEventHandlers() {
        this.floor.canvas.on("mouse:wheel", this.onMouseWheelHandler);
        this.floor.canvas.on("mouse:up", this.onMouseUp);

        if (this.floor.mode === FloorMode.LIVE) {
            this.floor.canvas.on("mouse:down", this.onMouseDownHandler);
            this.floor.canvas.on("mouse:move", this.onMouseMoveHandler);
        }
    }

    onMouseMoveHandler = () => {
        this.hasMouseMoved = true;
    };

    onMouseDownHandler = (opt: fabric.IEvent<MouseEvent>) => {
        if (this.floor.isInEditorMode) return;

        this.hasMouseMoved = false;

        if (isTable(opt.target)) {
            this.startElement = opt.target;
        }
    };

    onMouseUp = (opt: fabric.IEvent<MouseEvent>) => {
        if (this.floor.isInEditorMode) {
            // Your existing logic for editor mode here ...
            const hasActiveElement = this.floor.canvas.getActiveObject();
            if (!hasActiveElement) {
                this.floor.elementClickHandler(this.floor, void 0);
            }
        } else if (this.startElement) {
            // Logic for live mode
            const endElement = this.floor.canvas
                .getObjects()
                .find(
                    (obj) =>
                        obj.containsPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY)) &&
                        obj !== this.startElement,
                );

            if (isTable(endElement)) {
                this.floor.tableToTableHandler?.(this.startElement, endElement);
            }

            this.startElement = null; // reset after use
        }
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
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };
}
