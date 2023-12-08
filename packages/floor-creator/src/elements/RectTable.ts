import type { GroupProps } from "fabric";
import type { ReservationDoc } from "@firetable/types";
import type { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation.js";
import {
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
    TABLE_WIDTH,
    TABLE_HEIGHT,
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
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
    static override type = FloorElementTypes.RECT_TABLE;
    reservation: ReservationDoc | undefined;
    label: string;
    baseFill: string;
    private readonly initialWidth: number;
    private readonly initialHeight: number;
    private rect: Rect;
    private textLabel: FabricText;
    private animationStrategy: AnimationStrategy;

    constructor(options: RectTableElementOptions) {
        const baseFillComputed = options.groupOptions.baseFill || ELEMENT_DEFAULT_FILL_COLOR;
        const tableRect = new Rect({
            ...options.rectOptions,
            fill: baseFillComputed,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 0.5,
            strokeUniform: true,
        });

        const textLabel = new FabricText(options.groupOptions.label, {
            ...options.textOptions,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            textAlign: "center",
            originX: "center",
            originY: "center",
            left: tableRect.left + tableRect.width / 2,
            top: tableRect.top + tableRect.height / 2,
        });

        super([tableRect, textLabel], options.groupOptions);
        this.animationStrategy = new SmoothBlinkAnimation(this);
        this.rect = tableRect;
        this.textLabel = textLabel;
        this.initialWidth = tableRect.width;
        this.initialHeight = tableRect.height;
        this.label = options.groupOptions.label;
        this.baseFill = baseFillComputed;

        this.on("scaling", this.handleScaling.bind(this));
    }

    private handleScaling(): void {
        this.enforceMinimumDimensions();
        this.adjustTextScaling();
    }

    private adjustTextScaling(): void {
        this.textLabel.set({
            scaleX: 1 / this.scaleX,
            scaleY: 1 / this.scaleY,
        });

        this.canvas?.requestRenderAll();
    }

    private enforceMinimumDimensions(): void {
        if (this.scaleX * this.initialWidth < TABLE_WIDTH) {
            this.scaleX = TABLE_WIDTH / this.initialWidth;
        }

        if (this.scaleY * this.initialHeight < TABLE_HEIGHT) {
            this.scaleY = TABLE_HEIGHT / this.initialHeight;
        }
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

    static override async fromObject(object: any): Promise<RectTable> {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        return new RectTable({
            groupOptions: object,
            rectOptions: rectOpts,
            textOptions: textOpts,
        });
    }
}
