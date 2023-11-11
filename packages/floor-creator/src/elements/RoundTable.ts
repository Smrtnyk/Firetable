import { fabric } from "fabric";
import { FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants";
import { IGroupOptions } from "fabric/fabric-impl";
import { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation";

interface CircleTableElementOptions {
    groupOptions: {
        reservation?: Reservation;
        baseFill?: string;
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
    baseFill: string;
    private circle: fabric.Circle;
    private textLabel: fabric.Text;
    private animationStrategy: AnimationStrategy;

    constructor(options: CircleTableElementOptions) {
        const baseFillComputed = (options.groupOptions.baseFill as string) || "#444";
        const fill = determineTableColor(options.groupOptions.reservation, baseFillComputed);
        const tableCircle = new fabric.Circle({
            ...options.circleOptions,
            originX: "center",
            originY: "center",
            fill,
            stroke: "black",
            strokeWidth: 0.5,
        });
        const textLabel = new fabric.Text(options.textOptions.label, {
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
        this.animationStrategy = new SmoothBlinkAnimation(this);
        this.circle = tableCircle;
        this.textLabel = textLabel;
        this.label = options.groupOptions.label;
        this.baseFill = baseFillComputed;
        if (options.groupOptions.reservation) {
            this.reservation = options.groupOptions.reservation;
        }
    }

    getBaseFill(): string {
        return this.circle.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.baseFill = val;
        this.setFill(val);
    }

    setFill(val: string): void {
        this.circle.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    setLabel(newLabel: string): void {
        this.label = newLabel;
        this.textLabel.text = newLabel;
        this.canvas?.requestRenderAll();
    }

    startAnimation(): void {
        this.animationStrategy.animate();
    }

    stopAnimation(): void {
        this.animationStrategy.stop();
    }

    setReservation(reservation: Reservation | null): void {
        this.reservation = reservation;
    }

    toObject(): Record<string, unknown> {
        return {
            ...super.toObject(),
            opacity: 1,
            baseFill: this.baseFill,
            label: this.label,
            reservation: this.reservation,
            objectCaching: false,
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

// @ts-expect-error: Unreachable code error
fabric.RoundTable = fabric.util.createClass(RoundTable);
