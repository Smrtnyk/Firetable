import type { GroupProps } from "fabric";
import type { ReservationDoc } from "@firetable/types";
import type { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation";
import {
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants";
import { determineTableColor } from "../utils.js";
import { FloorElementTypes } from "../types";
import { Group, Circle, FabricText } from "fabric";

interface CircleTableElementOptions {
    groupOptions: {
        baseFill?: string;
        label: string;
    } & Partial<GroupProps>;
    textOptions: {
        label: string;
    };
    circleOptions: Record<string, unknown>;
}

export class RoundTable extends Group {
    static override type = FloorElementTypes.ROUND_TABLE;
    reservation: ReservationDoc | undefined;
    label: string;
    baseFill: string;
    private circle: Circle;
    private textLabel: FabricText;
    private animationStrategy: AnimationStrategy;

    constructor(options: CircleTableElementOptions) {
        const baseFillComputed =
            (options.groupOptions.baseFill as string) || ELEMENT_DEFAULT_FILL_COLOR;
        const tableCircle = new Circle({
            ...options.circleOptions,
            originX: "center",
            originY: "center",
            fill: baseFillComputed,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 0.5,
        });
        const textLabel = new FabricText(options.groupOptions.label, {
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

    static override async fromObject(object: any): Promise<RoundTable> {
        const circleOptions = object.objects[0];
        const textOptions = object.objects[1];
        return new RoundTable({
            groupOptions: object,
            circleOptions,
            textOptions,
        });
    }
}
