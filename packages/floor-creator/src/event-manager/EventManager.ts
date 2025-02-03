import type { TPointerEventInfo } from "fabric";

import { Point } from "fabric";

import type { Floor } from "../Floor.js";

export abstract class EventManager {
    protected readonly floor: Floor;

    protected constructor(floor: Floor) {
        this.floor = floor;
    }

    abstract destroy(): void;

    initializeCanvasEventHandlers(): void {
        this.floor.canvas.on("mouse:wheel", this.onMouseWheelHandler);
    }

    private readonly onMouseWheelHandler = (opt: TPointerEventInfo<WheelEvent>): void => {
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
