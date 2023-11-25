import { EventManager } from "./EventManager";
import { BaseTable } from "../types";
import { isTable } from "../type-guards";
import { fabric } from "fabric";
import { Floor } from "../Floor";

export class ViewerEventManager extends EventManager {
    private startElement: BaseTable | undefined;
    private isPanning: boolean = false;

    dragOccurred: boolean = false;

    constructor(floor: Floor) {
        super(floor);

        this.initializeCanvasEventHandlers();
    }

    destroy(): void {
        // NOOP here
    }

    initializeCanvasEventHandlers(): void {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("mouse:down", this.onTableTouchStart);
        this.floor.canvas.on("mouse:up", this.onTableTouchEnd);
    }

    onTableTouchStart = (options: fabric.IEvent): void => {
        this.startElement = undefined;
        const target = options.target;
        if (isTable(target)) {
            this.startElement = target;
            this.isPanning = true;
        }
        options.e.stopPropagation();
    };

    onTableTouchEnd = (options: fabric.IEvent<MouseEvent>): void => {
        if (this.isPanning && this.startElement) {
            const { x, y } = this.floor.canvas.getPointer(options.e, true);

            let endElement: BaseTable | undefined;
            this.floor.canvas.forEachObject((obj) => {
                if (obj.containsPoint(new fabric.Point(x, y)) && isTable(obj)) {
                    endElement = obj;
                }
            });

            if (endElement && endElement !== this.startElement) {
                this.floor.emit("tableToTable", this.floor, this.startElement, endElement);
                this.dragOccurred = true;
            }
        }
        this.startElement = undefined;
        this.isPanning = false;
    };
}
