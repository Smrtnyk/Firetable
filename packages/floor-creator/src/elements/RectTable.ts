import { fabric } from "fabric";
import { FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR, RESOLUTION } from "../constants";
import { IGroupOptions } from "fabric/fabric-impl";
import { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation.js";

interface RectTableElementOptions {
    groupOptions: {
        reservation?: Reservation;
        baseFill?: string;
        label: string;
    } & IGroupOptions;
    textOptions: {
        label: string;
    };
    rectOptions: Record<string, unknown>;
}

export class RectTable extends fabric.Group {
    type = FloorElementTypes.RECT_TABLE;
    reservation: Reservation | null = null;
    label: string;
    baseFill: string;
    private readonly initialStrokeWidth: number;
    private readonly initialWidth: number;
    private readonly initialHeight: number;
    private rect: fabric.Rect;
    private textLabel: fabric.Text;
    private animationStrategy: AnimationStrategy;

    constructor(options: RectTableElementOptions) {
        const baseFillComputed = (options.groupOptions.baseFill as string) || "#444";
        const fill = determineTableColor(options.groupOptions.reservation, baseFillComputed);
        const tableRect = new fabric.Rect({
            ...options.rectOptions,
            fill,
            stroke: "black",
            strokeWidth: 1,
        });

        const textLabel = new fabric.Text(options.textOptions.label, {
            ...options.textOptions,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            textAlign: "center",
            originX: "center",
            originY: "center",
            left: tableRect.left! + tableRect.width! / 2,
            top: tableRect.top! + tableRect.height! / 2,
        });

        super([tableRect, textLabel], options.groupOptions);
        this.animationStrategy = new SmoothBlinkAnimation(this);
        this.rect = tableRect;
        this.textLabel = textLabel;
        this.initialWidth = tableRect.width!;
        this.initialHeight = tableRect.height!;
        this.label = options.groupOptions.label;
        this.baseFill = baseFillComputed;
        if (options.groupOptions.reservation) {
            this.reservation = options.groupOptions.reservation;
        }

        this.initialStrokeWidth = tableRect.strokeWidth || 2;

        this.on("scaling", this.handleScaling.bind(this));
    }

    private handleScaling(): void {
        this.enforceStrokeWidth();
        this.enforceMinimumDimensions();
        this.snapToGrid();
        this.adjustTextScaling();
    }

    private adjustTextScaling(): void {
        if (!this.scaleX || !this.scaleY) return;

        // Inversely adjust the scaling of the textLabel
        this.textLabel.set({
            scaleX: 1 / this.scaleX,
            scaleY: 1 / this.scaleY,
        });

        // Adjust the position to keep it centered
        this.textLabel.set({
            left: this.rect.left! + this.rect.width! / 2,
            top: this.rect.top! + this.rect.height! / 2,
        });

        this.canvas?.renderAll();
    }

    private snapToGrid(): void {
        if (!this.scaleX || !this.scaleY) return;

        const targetWidth = this.initialWidth * this.scaleX;
        const targetHeight = this.initialHeight * this.scaleY;

        const snappedWidth = Math.round(targetWidth / RESOLUTION) * RESOLUTION;
        const snappedHeight = Math.round(targetHeight / RESOLUTION) * RESOLUTION;

        const correctedScaleX = snappedWidth / this.initialWidth;
        const correctedScaleY = snappedHeight / this.initialHeight;

        // @ts-ignore
        this.set({
            scaleX: correctedScaleX,
            scaleY: correctedScaleY,
        });
    }

    private enforceMinimumDimensions(): void {
        if (!this.scaleX || !this.scaleY) return;

        if (this.scaleX * this.initialWidth < 50) {
            this.scaleX = 50 / this.initialWidth;
        }

        if (this.scaleY * this.initialHeight < 50) {
            this.scaleY = 50 / this.initialHeight;
        }
    }

    private enforceStrokeWidth(): void {
        const tableRect = this.item(0) as fabric.Rect;
        if (!this.scaleX || !this.scaleY) return;
        tableRect.set({
            strokeWidth: this.initialStrokeWidth / Math.max(this.scaleX, this.scaleY),
        });
    }

    startAnimation() {
        this.animationStrategy.animate();
    }

    stopAnimation() {
        this.animationStrategy.stop();
    }

    getBaseFill(): string {
        return this.rect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.baseFill = val;
        this.setFill(val);
    }

    setFill(val: string): void {
        this.rect.set("fill", val);
        this.canvas?.renderAll();
    }

    setLabel(newLabel: string): void {
        this.label = newLabel;
        this.textLabel.set("text", newLabel);
        this.canvas?.renderAll();
    }

    setReservation(reservation: Reservation | null) {
        this.reservation = reservation;
    }

    toObject() {
        return {
            ...super.toObject(),
            baseFill: this.baseFill,
            label: this.label,
            reservation: this.reservation,
            objectCaching: false,
        };
    }

    static fromObject(object: any, callback: (obj: RectTable) => void): void {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        const instance = new RectTable({
            groupOptions: object,
            rectOptions: rectOpts,
            textOptions: textOpts,
        });
        callback(instance);
    }
}

// @ts-ignore: Unreachable code error
fabric.RectTable = fabric.util.createClass(RectTable);
