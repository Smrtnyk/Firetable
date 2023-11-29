import { TPointerEventInfo, Point } from "fabric";
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

    private onMouseWheelHandler = (opt: TPointerEventInfo<WheelEvent>): void => {
        if (!opt.e) {
            return;
        }

        if (opt.e.deltaY > 0) {
            this.floor.zoomManager.zoomIn(new Point(opt.e.offsetX, opt.e.offsetY));
        }

        if (opt.e.deltaY < 0) {
            this.floor.zoomManager.zoomOut(new Point(opt.e.offsetX, opt.e.offsetY));
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };
}
