import type { Canvas } from "fabric";
import { CircleBrush, SprayBrush, Shadow, FabricObject, PencilBrush } from "fabric";

export interface DrawingOptions {
    color?: string;
    width?: number;
}

export class DrawingManager {
    private isEnabled = true;
    private readonly canvas: Canvas;
    private currentColor = "#000000";
    private currentWidth = 2;

    constructor(canvas: Canvas) {
        this.canvas = canvas;

        this.canvas.freeDrawingBrush = new PencilBrush(canvas);
        this.applyBrushSettings();

        FabricObject.prototype.transparentCorners = false;
    }

    getIsEnabled(): boolean {
        return this.isEnabled;
    }

    enable(options?: DrawingOptions): void {
        this.isEnabled = true;
        this.canvas.set("isDrawingMode", true);

        if (this.canvas.freeDrawingBrush) {
            if (options?.color) {
                this.canvas.freeDrawingBrush.color = options.color;
            }
            if (options?.width) {
                this.canvas.freeDrawingBrush.width = options.width;
            }
        }

        this.canvas.requestRenderAll();
    }

    disable(): void {
        this.isEnabled = false;
        this.canvas.isDrawingMode = false;

        this.canvas.requestRenderAll();
    }

    setBrushType(type: "circle" | "pencil" | "spray"): void {
        switch (type) {
            case "spray":
                this.canvas.freeDrawingBrush = new SprayBrush(this.canvas);
                break;
            case "circle":
                this.canvas.freeDrawingBrush = new CircleBrush(this.canvas);
                break;
            default:
                this.canvas.freeDrawingBrush = new PencilBrush(this.canvas);
                break;
        }

        this.applyBrushSettings();
    }

    setBrushColor(color: string): void {
        this.currentColor = color;
        this.applyBrushSettings();
    }

    setBrushWidth(width: number): void {
        this.currentWidth = width;
        this.applyBrushSettings();
    }

    clearDrawings(): void {
        const objects = this.canvas.getObjects();
        const paths = objects.filter((obj) => obj.type === "path");
        paths.forEach((path) => this.canvas.remove(path));
        this.canvas.requestRenderAll();
    }

    destroy(): void {
        this.disable();
    }

    private applyBrushSettings(): void {
        if (!this.canvas.freeDrawingBrush) return;

        this.canvas.freeDrawingBrush.color = this.currentColor;
        this.canvas.freeDrawingBrush.width = this.currentWidth;

        this.canvas.freeDrawingBrush.shadow = new Shadow({
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            affectStroke: true,
            color: this.currentColor,
        });

        this.canvas.requestRenderAll();
    }
}
