import type { GroupProps } from "fabric";
import type { ReservationDoc } from "@firetable/types";
import type { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation.js";
import {
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
    RESOLUTION,
    TABLE_WIDTH,
    TABLE_HEIGHT,
} from "../constants";
import { determineTableColor } from "../utils.js";
import { FloorElementTypes } from "../types";
import { Group, Rect, FabricText } from "fabric";

interface RectTableElementOptions {
    groupOptions: {
        baseFill?: string;
        label: string;
    } & Partial<GroupProps>;
    textOptions: {
        label: string;
    };
    rectOptions: Record<string, unknown>;
}

export class RectTable extends Group {
    static type = FloorElementTypes.RECT_TABLE;
    reservation: ReservationDoc | undefined;
    label: string;
    baseFill: string;
    private readonly initialStrokeWidth: number;
    private readonly initialWidth: number;
    private readonly initialHeight: number;
    private rect: Rect;
    private textLabel: FabricText;
    private animationStrategy: AnimationStrategy;

    constructor(options: RectTableElementOptions) {
        const baseFillComputed = options.groupOptions.baseFill || "#444";
        const tableRect = new Rect({
            ...options.rectOptions,
            fill: baseFillComputed,
            stroke: "black",
            strokeWidth: 0.5,
        });

        const textLabel = new FabricText(options.groupOptions.label, {
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
        if (!this.scaleX || !this.scaleY) {
            return;
        }

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

        this.canvas?.requestRenderAll();
    }

    private snapToGrid(): void {
        if (!this.scaleX || !this.scaleY) {
            return;
        }

        const targetWidth = this.initialWidth * this.scaleX;
        const targetHeight = this.initialHeight * this.scaleY;

        const snappedWidth = Math.round(targetWidth / RESOLUTION) * RESOLUTION;
        const snappedHeight = Math.round(targetHeight / RESOLUTION) * RESOLUTION;

        const correctedScaleX = snappedWidth / this.initialWidth;
        const correctedScaleY = snappedHeight / this.initialHeight;

        this.set({
            scaleX: correctedScaleX,
            scaleY: correctedScaleY,
        });
    }

    private enforceMinimumDimensions(): void {
        if (!this.scaleX || !this.scaleY) {
            return;
        }

        if (this.scaleX * this.initialWidth < TABLE_WIDTH) {
            this.scaleX = TABLE_WIDTH / this.initialWidth;
        }

        if (this.scaleY * this.initialHeight < TABLE_HEIGHT) {
            this.scaleY = TABLE_HEIGHT / this.initialHeight;
        }
    }

    private enforceStrokeWidth(): void {
        const tableRect = this.item(0);
        if (!this.scaleX || !this.scaleY) {
            return;
        }
        tableRect.set({
            strokeWidth: this.initialStrokeWidth / Math.max(this.scaleX, this.scaleY),
        });
    }

    startAnimation(): void {
        this.animationStrategy.animate();
    }

    stopAnimation(): void {
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
        this.canvas?.requestRenderAll();
    }

    setLabel(newLabel: string): void {
        this.label = newLabel;
        this.textLabel.set("text", newLabel);
        this.canvas?.requestRenderAll();
    }

    setReservation(reservation: ReservationDoc | undefined): void {
        this.reservation = reservation;
        const fill = determineTableColor(reservation, this.baseFill);
        this.setFill(fill);
    }

    // @ts-expect-error -- ok
    toObject(): Record<string, unknown> {
        return {
            ...super.toObject(),
            opacity: 1,
            baseFill: this.baseFill,
            label: this.label,
        };
    }

    static async fromObject(object: any): Promise<RectTable> {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        return new RectTable({
            groupOptions: object,
            rectOptions: rectOpts,
            textOptions: textOpts,
        });
    }
}
