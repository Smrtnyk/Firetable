import { fabric } from "fabric";
import { FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants";
import { IGroupOptions } from "fabric/fabric-impl";

interface CircleTableElementOptions {
    groupOptions: {
        reservation?: Reservation;
        label: string;
    } & IGroupOptions;
    textOptions: {
        label: string;
    };
    circleOptions: Record<string, unknown>;
}

export class RoundTable extends fabric.Group {
    type = FloorElementTypes.ROUND_TABLE;
    reservation: Reservation | null = null;
    label: string;
    private isAnimating: boolean = false;

    constructor(options: CircleTableElementOptions) {
        const fill = determineTableColor(options.groupOptions.reservation);
        const tableCircle = new fabric.Circle({
            ...options.circleOptions,
            originX: "center",
            originY: "center",
            fill,
            stroke: "black",
            strokeWidth: 2,
        });
        const textLabel = new fabric.Text(options.groupOptions.label, {
            ...options.textOptions,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            left: tableCircle.left,
            top: tableCircle.top,
            textAlign: "center",
            originX: "center",
            originY: "center",
        });
        super([tableCircle, textLabel], options.groupOptions);

        this.label = options.groupOptions.label;
        if (options.groupOptions.reservation) this.reservation = options.groupOptions.reservation;
    }

    startSmoothBlinking() {
        if (this.isAnimating) return; // Already animating

        this.isAnimating = true;
        this.smoothBlink();
    }

    private smoothBlink() {
        if (!this.isAnimating) return;

        this.animate("opacity", 0, {
            duration: 500, // Adjust as necessary
            onChange: this.canvas?.renderAll.bind(this.canvas), // Bind necessary if inside class
            onComplete: () => {
                this.animate("opacity", 1, {
                    duration: 500, // Adjust as necessary
                    onChange: this.canvas?.renderAll.bind(this.canvas), // Bind necessary if inside class
                    onComplete: () => {
                        this.smoothBlink(); // Loop the animation
                    },
                });
            },
        });
    }

    stopSmoothBlinking() {
        this.isAnimating = false;
        // @ts-ignore
        this.set({ opacity: 1 }); // Ensure it's fully visible when animation stops
        this.canvas?.renderAll(); // Re-render canvas to apply opacity change
    }

    toObject() {
        return {
            ...super.toObject(),
            label: this.label,
            reservation: this.reservation,
        };
    }

    static fromObject(object: any, callback: (obj: RoundTable) => void): void {
        const circleOptions = object.objects[0];
        const textOptions = object.objects[1];
        const instance = new RoundTable({
            groupOptions: object,
            circleOptions,
            textOptions,
        });
        callback(instance);
    }
}

// @ts-ignore: Unreachable code error
fabric.RoundTable = fabric.util.createClass(RoundTable);
