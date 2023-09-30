import { fabric } from "fabric";

export class Wall extends fabric.Rect {
    static MIN_WIDTH = 10;
    static MIN_HEIGHT = 10;
    private readonly initialWidth: number;
    private readonly initialHeight: number;
    private readonly initialStrokeWidth: number;

    constructor(left: number, top: number) {
        super({
            left: left,
            top: top,
            width: Wall.MIN_WIDTH,
            height: 100,
            fill: "#444",
            stroke: "black",
            strokeWidth: 2,
        });

        this.initialWidth = Wall.MIN_WIDTH;
        this.initialHeight = this.height ?? Wall.MIN_HEIGHT;
        this.initialStrokeWidth = 2;

        this.on("scaling", this.handleScaling.bind(this));
    }

    private handleScaling(): void {
        this.enforceMinimumWidth();
        this.enforceMinimumHeight();
        this.enforceStrokeWidth();
    }

    private enforceMinimumWidth(): void {
        if (this.scaleX && this.scaleX * this.initialWidth < Wall.MIN_WIDTH) {
            this.scaleX = Wall.MIN_WIDTH / this.initialWidth;
        }
    }

    private enforceMinimumHeight(): void {
        if (this.scaleY && this.scaleY * this.initialHeight < Wall.MIN_HEIGHT) {
            this.scaleY = Wall.MIN_HEIGHT / this.initialHeight;
        }
    }

    private enforceStrokeWidth(): void {
        if (!this.scaleX || !this.scaleY) return;
        // @ts-ignore -- Adjust the strokeWidth based on the scale
        this.set({
            strokeWidth: this.initialStrokeWidth / Math.max(this.scaleX, this.scaleY),
        });
    }
}

// @ts-ignore Register the Wall class with Fabric
fabric.Wall = fabric.util.createClass(Wall);
