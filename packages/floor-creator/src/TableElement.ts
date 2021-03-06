import { fabric } from "fabric";
import { FloorElementTypes } from "./types";
import { determineTableColor } from "./utils";
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
        };
    }

    _render(ctx: CanvasRenderingContext2D) {
        super._render(ctx);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
}

// @ts-ignore
fabric.tableElement = TableElement;
// @ts-ignore
fabric.tableElement.fromObject = function (object, callback) {
    return fabric.Object._fromObject("TableElement", object, callback);
};
