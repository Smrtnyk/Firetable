import type { AnimationStrategy } from "./AnimationStrategy.js";
import type { FabricObject } from "fabric";
import { noop } from "es-toolkit";

const ANIMATION_DURATION = 500;

export class SmoothBlinkAnimation implements AnimationStrategy {
    private isAnimating = false;
    private readonly target: FabricObject;

    constructor(target: FabricObject) {
        this.target = target;
    }

    stop(): void {
        this.isAnimating = false;
        this.target.set({ opacity: 1 });
        this.target.canvas?.requestRenderAll();
    }

    animate(): void {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;
        this.smoothBlink();
    }

    private smoothBlink(): void {
        if (!this.isAnimating) {
            return;
        }
        this.target.animate(
            { opacity: 0 },
            {
                duration: ANIMATION_DURATION,
                onChange: this.target.canvas?.requestRenderAll.bind(this.target.canvas) ?? noop,
                onComplete: () => {
                    this.target.animate(
                        { opacity: 1 },
                        {
                            duration: ANIMATION_DURATION,
                            onChange:
                                this.target.canvas?.requestRenderAll.bind(this.target.canvas) ??
                                noop,
                            onComplete: this.smoothBlink.bind(this),
                        },
                    );
                },
            },
        );
    }
}
