import { RESOLUTION } from "./constants";
import { Canvas, Line, Group } from "fabric";

export class GridDrawer {
    private canvas: Canvas;
    private isGridVisible = true;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    drawGrid(width: number, height: number): void {
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
        const lineOption = { stroke: "rgba(0,0,0,1)", strokeWidth: 0.5, selectable: false };
        const lines = [];

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
        const objects = this.canvas.getObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
            // @ts-expect-error -- custom prop
            if (objects[i].isGridLine) {
                this.canvas.remove(objects[i]);
            }
        }
        this.canvas.requestRenderAll();
    }
}
