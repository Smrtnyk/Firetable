import { AnimationStrategy } from "./AnimationStrategy";
import { fabric } from "fabric";

const ANIMATION_DURATION = 500;

export class SmoothBlinkAnimation implements AnimationStrategy {
    private isAnimating: boolean = false;

    constructor(private target: fabric.Object) {}

    animate() {
        if (this.isAnimating) return; // Already animating

        this.isAnimating = true;
        this.smoothBlink();
    }

    private smoothBlink() {
        if (!this.isAnimating) return;
        this.target.animate("opacity", 0, {
            duration: ANIMATION_DURATION,
            onChange: this.target.canvas?.renderAll.bind(this.target.canvas),
            onComplete: () => {
                this.target.animate("opacity", 1, {
                    duration: ANIMATION_DURATION,
                    onChange: this.target.canvas?.renderAll.bind(this.target.canvas),
                    onComplete: () => {
                        this.smoothBlink(); // Loop the animation
                    },
                });
            },
        });
    }

    stop() {
        this.isAnimating = false;
        this.target.set({ opacity: 1 });
        this.target.canvas?.renderAll();
    }
}
