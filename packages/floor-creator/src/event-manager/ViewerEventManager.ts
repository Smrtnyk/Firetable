import { EventManager } from "./EventManager";
import { BaseTable } from "../types";
import { isTable } from "../type-guards";
import { fabric } from "fabric";
import { Floor } from "../Floor";

export class ViewerEventManager extends EventManager {
    private startElement: BaseTable | null = null;
    private isPanning: boolean = false;

    dragOccurred: boolean = false;

    constructor(floor: Floor) {
        super(floor);

        this.initializeCanvasEventHandlers();
    }

    destroy() {}

    initializeCanvasEventHandlers() {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("mouse:down", this.onTableTouchStart);
        this.floor.canvas.on("mouse:up", this.onTableTouchEnd);
    }

    onTableTouchStart = (options: fabric.IEvent) => {
        const target = options.target;
        if (isTable(target)) {
            this.startElement = target;
            this.isPanning = true;
        }
    };

    onTableTouchEnd = (options: fabric.IEvent) => {
        if (this.isPanning && this.startElement) {
            const pointer = this.floor.canvas.getPointer(options.e);
            const endElement = this.floor.canvas.findTarget(
                new MouseEvent("mousemove", {
                    clientX: pointer.x,
                    clientY: pointer.y,
                }),
                false,
            );

            if (isTable(endElement) && endElement !== this.startElement) {
                this.floor.emit("tableToTable", this.floor, this.startElement, endElement);
                this.dragOccurred = true;
            }
        }
        this.startElement = null; // reset after use
        this.isPanning = false;
    };
}
