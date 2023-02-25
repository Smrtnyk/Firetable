import { fabric } from "fabric";
import { ElementClickHandler, FloorDoubleClickHandler, NumberTuple } from "../types";
import { RESOLUTION } from "../constants";
import type { Floor } from "../Floor";
import { containsTables, getTableFromTargetElement } from "../utils";

export class InteractionsEngine {
    dblClickHandler: FloorDoubleClickHandler | undefined;
    elementClickHandler: ElementClickHandler;
    floor: Floor;

    constructor(
        floor: Floor,
        elementClickHandler: ElementClickHandler,
        dblClickHandler: FloorDoubleClickHandler | undefined
    ) {
        this.floor = floor;
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;
        this.floor.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.floor.canvas.on("mouse:up", this.onMouseUpHandler);
        this.floor.canvas.on("object:moving", this.onObjectMove);
        this.floor.canvas.on("object:scaling", (e) => {
            if (!e.target) return;
            this.elementClickHandler(this.floor, getTableFromTargetElement(e));
        });
    }

    // Check if double click was on the actual table
    // if it is, then do nothing, but if it is not
    // then invoke the handler
    onDblClickHandler(ev: fabric.IEvent<MouseEvent>) {
        if (containsTables(ev)) return;
        const coords: NumberTuple = [ev.pointer?.x || 50, ev.pointer?.y || 50];
        this.dblClickHandler?.(this.floor, coords);
    }

    onMouseUpHandler(ev: fabric.IEvent<MouseEvent>) {
        if (containsTables(ev)) return;
        this.elementClickHandler(this.floor, null);
    }

    onElementClick(ev: fabric.IEvent<MouseEvent>) {
        this.elementClickHandler(this.floor, getTableFromTargetElement(ev));
    }

    onObjectMove(options: fabric.IEvent) {
        if (!options.target?.left || !options.target?.top) return;
        const shouldSnapToGrid =
            Math.round((options.target.left / RESOLUTION) * 4) % 4 === 0 &&
            Math.round((options.target.top / RESOLUTION) * 4) % 4 === 0;
        if (shouldSnapToGrid) {
            options.target
                .set({
                    left: Math.round(options.target.left / RESOLUTION) * RESOLUTION,
                    top: Math.round(options.target.top / RESOLUTION) * RESOLUTION,
                })
                .setCoords();
        }
    }
}
