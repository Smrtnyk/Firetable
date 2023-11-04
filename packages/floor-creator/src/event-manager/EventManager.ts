import { fabric } from "fabric";
import { Floor } from "../Floor";

export abstract class EventManager {
    protected readonly floor: Floor;

    abstract destroy(): void;

    constructor(floor: Floor) {
        this.floor = floor;
    }

    initializeCanvasEventHandlers(): void {
        this.floor.canvas.on("mouse:wheel", this.onMouseWheelHandler);
    }

    private onMouseWheelHandler = (opt: fabric.IEvent<WheelEvent>): void => {
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
