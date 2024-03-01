import type { AnimationStrategy } from "./AnimationStrategy.js";
import type { FabricObject } from "fabric/es";
import { NOOP } from "@firetable/utils";

const ANIMATION_DURATION = 500;

export class SmoothBlinkAnimation implements AnimationStrategy {
    private isAnimating: boolean = false;

    constructor(private target: FabricObject) {}

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
                onChange: this.target.canvas?.requestRenderAll.bind(this.target.canvas) ?? NOOP,
                onComplete: () => {
                    this.target.animate(
                        { opacity: 1 },
                        {
                            duration: ANIMATION_DURATION,
                            onChange:
                                this.target.canvas?.requestRenderAll.bind(this.target.canvas) ??
                                NOOP,
                            onComplete: () => {
                                this.smoothBlink(); // Loop the animation
                            },
                        },
                    );
                },
            },
        );
    }

    stop(): void {
        this.isAnimating = false;
        this.target.set({ opacity: 1 });
        this.target.canvas?.requestRenderAll();
    }
}
