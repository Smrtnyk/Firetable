import { fabric } from "fabric";
import { FloorElementTypes } from "src/floor-manager/types";
import { Reservation } from "src/types/event";
import { determineTableColor } from "src/floor-manager/utils";

interface CircleTableElementOptions extends fabric.ICircleOptions {
    reservation?: Reservation;
    label: string;
}

export class RoundTableElement extends fabric.Circle {
    type = FloorElementTypes.ROUND_TABLE;
    reservation: null | Reservation = null;
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

    _render(ctx: CanvasRenderingContext2D) {
        super._render(ctx);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
}

// @ts-ignore
fabric.roundTableElement = RoundTableElement;
// @ts-ignore
fabric.roundTableElement.fromObject = function (object, callback) {
    return fabric.Object._fromObject("RoundTableElement", object, callback);
};