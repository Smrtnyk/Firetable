import { fabric } from "fabric";
import { FloorElementTypes } from "./types.js";
import { determineTableColor } from "./utils.js";
import { Reservation } from "@firetable/types";

interface ITableElementOptions extends fabric.IRectOptions {
    width: number;
    height: number;
    reservation?: Reservation;
    label: string;
}

export class TableElement extends fabric.Rect {
    type: FloorElementTypes = FloorElementTypes.RECT_TABLE;
    reservation: Reservation | null = null;
    label: string;
    animDirection = "up";

    constructor(options: ITableElementOptions) {
        const fill = determineTableColor(options.reservation);
        super({
            ...options,
            fill,
        });
        this.label = options.label;
        if (options.reservation) this.reservation = options.reservation;
    }

    toObject() {
        return {
            ...super.toObject(),
            label: this.label,
            reservation: this.reservation,
            objectCaching: false,
        };
    }

    _render(ctx: CanvasRenderingContext2D) {
        super._render(ctx);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }

    clearAnimation() {
        super.set("opacity", 1);
    }

    animateWidthAndHeight() {
        const superOpacity = super.get("opacity");
        if (typeof superOpacity !== "number") return;

        super.set("dirty", true);
        console.log("animating");
        const interval = 0.1;

        if (superOpacity >= 0 && superOpacity <= 1) {
            const actualInterval = this.animDirection === "up" ? interval : -interval;
            super.set("opacity", superOpacity + actualInterval);
        }

        if (superOpacity >= 1) {
            this.animDirection = "down";
            super.set("opacity", superOpacity - interval);
        }
        if (superOpacity <= 0) {
            this.animDirection = "up";
            super.set("opacity", superOpacity + interval);
        }
    }
}

// @ts-ignore
fabric.tableElement = TableElement;
// @ts-ignore
fabric.tableElement.fromObject = function (object, callback) {
    return fabric.Object._fromObject("TableElement", object, callback);
};
