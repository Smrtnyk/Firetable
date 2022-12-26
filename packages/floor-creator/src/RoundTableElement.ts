import { fabric } from "fabric";
import { FloorElementTypes } from "./types.js";
import { determineTableColor } from "./utils.js";
import { isSome, None, Option, Reservation } from "@firetable/types";

interface CircleTableElementOptions extends fabric.ICircleOptions {
    reservation: Option<Reservation>;
    label: string;
}

export class RoundTableElement extends fabric.Circle {
    type = FloorElementTypes.ROUND_TABLE;
    reservation: Option<Reservation> = None();
    label: string;

    constructor(options: CircleTableElementOptions) {
        const fill = determineTableColor(options.reservation);
        super({
            ...options,
            fill,
        });
        this.label = options.label;
        if (isSome(options.reservation)) this.reservation = options.reservation;
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
fabric.roundTableElement.fromObject = function (object: fabric.Object, callback) {
    return fabric.Object._fromObject("RoundTableElement", object, callback);
};
