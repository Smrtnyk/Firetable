import { fabric } from "fabric";
import { FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";

interface CircleTableElementOptions extends fabric.ICircleOptions {
    reservation?: Reservation;
    label: string;
}

export class RoundTable extends fabric.Circle {
    type = FloorElementTypes.ROUND_TABLE;
    reservation: Reservation | null = null;
    label: string;

    constructor(options: CircleTableElementOptions) {
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
        };
    }

    clearAnimation() {
        super.set("opacity", 1);
    }

    _render(ctx: CanvasRenderingContext2D) {
        super._render(ctx);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    animateWidthAndHeight() {}
}

// @ts-ignore
fabric[FloorElementTypes.ROUND_TABLE] = RoundTable;
// @ts-ignore
fabric[FloorElementTypes.ROUND_TABLE].fromObject = function (object: fabric.Object, callback) {
    return fabric.Object._fromObject(FloorElementTypes.ROUND_TABLE, object, callback);
};
