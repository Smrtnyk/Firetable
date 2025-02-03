import type { Canvas } from "fabric";

import { CircleBrush, FabricObject, PencilBrush, Shadow, SprayBrush } from "fabric";

export interface DrawingOptions {
    color?: string;
    width?: number;
}

export class DrawingManager {
    private readonly canvas: Canvas;
    private currentColor = "#000000";
    private currentWidth = 2;
    private isEnabled = true;

    constructor(canvas: Canvas) {
        this.canvas = canvas;

        this.canvas.freeDrawingBrush = new PencilBrush(canvas);
        this.applyBrushSettings();

        FabricObject.prototype.transparentCorners = false;
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

    disable(): void {
        this.isEnabled = false;
        this.canvas.isDrawingMode = false;

        this.canvas.requestRenderAll();
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

    getIsEnabled(): boolean {
        return this.isEnabled;
    }

    setBrushColor(color: string): void {
        this.currentColor = color;
        this.applyBrushSettings();
    }

    setBrushType(type: "circle" | "pencil" | "spray"): void {
        switch (type) {
            case "circle":
                this.canvas.freeDrawingBrush = new CircleBrush(this.canvas);
                break;
            case "spray":
                this.canvas.freeDrawingBrush = new SprayBrush(this.canvas);
                break;
            default:
                this.canvas.freeDrawingBrush = new PencilBrush(this.canvas);
                break;
        }

        this.applyBrushSettings();
    }

    setBrushWidth(width: number): void {
        this.currentWidth = width;
        this.applyBrushSettings();
    }

    private applyBrushSettings(): void {
        if (!this.canvas.freeDrawingBrush) return;

        this.canvas.freeDrawingBrush.color = this.currentColor;
        this.canvas.freeDrawingBrush.width = this.currentWidth;

        this.canvas.freeDrawingBrush.shadow = new Shadow({
            affectStroke: true,
            blur: 0,
            color: this.currentColor,
            offsetX: 0,
            offsetY: 0,
        });

        this.canvas.requestRenderAll();
    }
}
