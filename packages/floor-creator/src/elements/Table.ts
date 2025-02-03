import type { Circle, FabricText, GroupProps, Rect } from "fabric";

import { omit } from "es-toolkit";
import { Group, LayoutManager } from "fabric";

import type { FloorEditorElement } from "../types.js";
import type { AnimationStrategy } from "./animation/AnimationStrategy.js";

import { TABLE_HEIGHT, TABLE_WIDTH } from "../constants.js";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation.js";

interface TableElementOptions {
    groupOptions: Partial<GroupProps> & {
        [key: string]: unknown;
        baseFill?: string;
        label: string;
    };
    shapeOptions: Record<string, unknown>;
    textOptions: {
        label: string;
    };
}

export abstract class Table extends Group implements FloorEditorElement {
    baseFill: string;
    label: string;
    private readonly animationStrategy: AnimationStrategy;
    private readonly initialHeight: number;
    private readonly initialWidth: number;
    private readonly shape: Circle | Rect;
    private readonly textLabel: FabricText;

    protected constructor(elements: [Circle | Rect, FabricText], options: TableElementOptions) {
        const groupOptions = omit(options.groupOptions, ["type"]);
        super(elements, {
            ...groupOptions,
            layoutManager: new LayoutManager(),
        });
        const [shape, textLabel] = elements;
        this.animationStrategy = new SmoothBlinkAnimation(this);
        this.shape = shape;
        this.textLabel = textLabel;
        this.initialWidth = shape.width;
        this.initialHeight = shape.height;
        this.label = options.groupOptions.label;
        this.baseFill = shape.get("fill");

        this.on("scaling", this.handleScaling.bind(this));
    }

    getBaseFill(): string {
        return this.shape.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.baseFill = val;
        this.setFill(val);
    }

    setFill(val: string): void {
        this.shape.set("fill", val);
    }

    setLabel(newLabel: string): void {
        this.label = newLabel;
        this.textLabel.set("text", newLabel);
        this.canvas?.requestRenderAll();
    }

    setVIPStatus(isVIP: boolean): void {
        this.shape.set({
            shadow: isVIP ? "0px 0px 7px rgba(255, 215, 0, 0.9)" : "none",
        });

        this.canvas?.requestRenderAll();
    }

    startAnimation(): void {
        this.animationStrategy.animate();
    }

    stopAnimation(): void {
        this.animationStrategy.stop();
    }

    // @ts-expect-error -- seems like having proper return type here is a bit tricky
    toObject(): Record<string, unknown> {
        return {
            ...super.toObject(),
            baseFill: this.baseFill,
            label: this.label,
            opacity: 1,
        };
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

    private handleScaling(): void {
        this.enforceMinimumDimensions();
        this.adjustTextScaling();
    }
}
