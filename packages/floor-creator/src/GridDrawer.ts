import type { Canvas } from "fabric";
import { RESOLUTION } from "./constants.js";
import { Line, Group } from "fabric";
import { propIsTruthy } from "@firetable/utils";

export class GridDrawer {
    private canvas: Canvas;
    private isGridVisible = true;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    drawGrid(width: number, height: number): void {
        this.clearGrid();
        const gridSize = RESOLUTION;
        const left = (width % gridSize) / 2;
        const top = (height % gridSize) / 2;

        const lines = this.createGridLines(width, height, gridSize, left, top);
        this.addGridToCanvas(lines);
    }

    private createGridLines(
        width: number,
        height: number,
        gridSize: number,
        left: number,
        top: number,
    ): Line[] {
        const lineOption = {
            stroke: "#000",
            strokeUniform: true,
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            strokeDashArray: [3, 3],
        };
        const lines: Line[] = [];

        for (let i = Math.ceil(width / gridSize); i--; ) {
            lines.push(new Line([gridSize * i, -top, gridSize * i, height], lineOption));
        }
        for (let i = Math.ceil(height / gridSize); i--; ) {
            lines.push(new Line([-left, gridSize * i, width, gridSize * i], lineOption));
        }

        return lines;
    }

    private addGridToCanvas(lines: Line[]): void {
        const oGridGroup = new Group(lines, {
            left: 0,
            top: 0,
            selectable: false,
            excludeFromExport: true,
            evented: false,
            // @ts-expect-error -- custom prop
            isGridLine: true,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendObjectToBack(oGridGroup);
    }

    toggleGridVisibility = (width: number, height: number): void => {
        if (this.isGridVisible) {
            this.clearGrid();
        } else {
            this.drawGrid(width, height);
        }
        this.isGridVisible = !this.isGridVisible;
    };

    clearGrid(): void {
        this.canvas
            .getObjects()
            // @ts-expect-error - custom set prop
            .filter(propIsTruthy("isGridLine"))
            .forEach((obj) => {
                this.canvas.remove(obj);
            });
        this.canvas.requestRenderAll();
    }
}
