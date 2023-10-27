import { EventManager } from "./EventManager";
import { fabric } from "fabric";
import { isTable } from "../type-guards";
import { BaseTable } from "../types";

export class ViewerEventManager extends EventManager {
    private startElement: BaseTable | null = null;
    hasMouseMoved: boolean = false;

    initializeCanvasEventHandlers() {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("mouse:up", this.onViewerMouseUp);
        this.floor.canvas.on("mouse:down", this.onViewerMouseDown);
        this.floor.canvas.on("mouse:move", this.onViewerMouseMove);
    }

    onViewerMouseMove = () => {
        this.hasMouseMoved = true;
    };

    onViewerMouseDown = (opt: fabric.IEvent<MouseEvent>) => {
        this.hasMouseMoved = false;

        if (isTable(opt.target)) {
            this.startElement = opt.target;
        }
    };

    private onViewerMouseUp = (opt: fabric.IEvent<MouseEvent>) => {
        if (this.startElement) {
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
}
