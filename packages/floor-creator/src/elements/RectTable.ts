import { fabric } from "fabric";
import { AnimationDirection, FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";
import { isNumber } from "@firetable/utils";

interface ITableElementOptions extends fabric.IRectOptions {
    width: number;
    height: number;
    reservation?: Reservation;
    label: string;
}

export class RectTable extends fabric.Rect {
    type: FloorElementTypes = FloorElementTypes.RECT_TABLE;
    reservation: Reservation | null = null;
    label: string;
    animDirection = AnimationDirection.UP;

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
        if (!isNumber(superOpacity)) return;

        super.set("dirty", true);
        const interval = 0.1;

        if (superOpacity >= 0 && superOpacity <= 1) {
            const actualInterval =
                this.animDirection === AnimationDirection.UP ? interval : -interval;
            super.set("opacity", superOpacity + actualInterval);
        }

        if (superOpacity >= 1) {
            this.animDirection = AnimationDirection.DOWN;
            super.set("opacity", superOpacity - interval);
        }
        if (superOpacity <= 0) {
            this.animDirection = AnimationDirection.UP;
            super.set("opacity", superOpacity + interval);
        }
    }
}

// @ts-ignore
fabric[FloorElementTypes.RECT_TABLE] = RectTable;
// @ts-ignore
fabric[FloorElementTypes.RECT_TABLE].fromObject = function (object, callback) {
    return fabric.Object._fromObject(FloorElementTypes.RECT_TABLE, object, callback);
};
