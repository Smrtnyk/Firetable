import type { GroupProps, Rect, FabricText, Circle } from "fabric";
import type { AnimationStrategy } from "./animation/AnimationStrategy";
import { SmoothBlinkAnimation } from "./animation/SmoothBlinkAnimation.js";
import { TABLE_WIDTH, TABLE_HEIGHT } from "../constants";
import { Group } from "fabric";

interface TableElementOptions {
    groupOptions: {
        baseFill?: string;
        label: string;
    } & Partial<GroupProps>;
    textOptions: {
        label: string;
    };
    shapeOptions: Record<string, unknown>;
}

export abstract class Table extends Group {
    label: string;
    baseFill: string;
    private readonly initialWidth: number;
    private readonly initialHeight: number;
    private shape: Rect | Circle;
    private textLabel: FabricText;
    private animationStrategy: AnimationStrategy;

    protected constructor(elements: [Rect | Circle, FabricText], options: TableElementOptions) {
        super(elements, options.groupOptions);
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
        return this.shape.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.baseFill = val;
        this.setFill(val);
    }

    setFill(val: string): void {
        this.shape.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    setLabel(newLabel: string): void {
        this.label = newLabel;
        this.textLabel.set("text", newLabel);
        this.canvas?.requestRenderAll();
    }

    setVIPStatus(isVIP: boolean): void {
        this.shape.set({
            shadow: isVIP ? "0 0 3px rgba(255, 215, 0, 0.7)" : "none",
        });

        this.canvas?.requestRenderAll();
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
}
