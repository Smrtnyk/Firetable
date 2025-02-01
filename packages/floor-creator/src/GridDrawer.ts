import type { Canvas, FabricObject } from "fabric";
import { RESOLUTION } from "./constants.js";
import { Line, Group } from "fabric";
import { has } from "es-toolkit/compat";
import { range } from "es-toolkit";

declare module "fabric" {
    interface GroupProps {
        isGridLine?: boolean;
    }
    interface Group {
        isGridLine?: boolean;
    }
}

const LINE_OPTION = {
    stroke: "#000",
    strokeUniform: true,
    strokeWidth: 0.5,
    selectable: false,
    evented: false,
    strokeDashArray: [3, 3],
};

export class GridDrawer {
    isGridVisible = false;
    private readonly canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    drawGrid(width: number, height: number): void {
        this.clearGrid();
        const lines = this.createGridLines(width, height, RESOLUTION);
        this.addGridToCanvas(lines);
    }

    toggleGridVisibility(width: number, height: number): void {
        if (this.isGridVisible) {
            this.clearGrid();
        } else {
            this.drawGrid(width, height);
        }
        this.isGridVisible = !this.isGridVisible;
    }

    requestGridDraw(width: number, height: number): void {
        if (this.isGridVisible && this.getGridLines().length === 0) {
            this.drawGrid(width, height);
        }
    }

    clearGrid(): void {
        const { canvas } = this;
        this.getGridLines().forEach(function (obj) {
            canvas.remove(obj);
        });
        canvas.requestRenderAll();
    }

    private getGridLines(): FabricObject[] {
        return this.canvas.getObjects().filter(function (obj) {
            return has(obj, "isGridLine");
        });
    }

    private createGridLines(width: number, height: number, gridSize: number): Line[] {
        const wCount = Math.ceil(width / gridSize);
        const hCount = Math.ceil(height / gridSize);

        const verticalLines = range(wCount).map(
            (i) => new Line([gridSize * i, 0, gridSize * i, height], LINE_OPTION),
        );

        const horizontalLines = range(hCount).map(
            (i) => new Line([0, gridSize * i, width, gridSize * i], LINE_OPTION),
        );

        // Remove edge lines
        verticalLines.shift();
        horizontalLines.shift();

        return [...verticalLines, ...horizontalLines];
    }

    private addGridToCanvas(lines: Line[]): void {
        const oGridGroup = new Group(lines, {
            left: -0.25,
            top: -0.25,
            selectable: false,
            excludeFromExport: true,
            evented: false,
            isGridLine: true,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendObjectToBack(oGridGroup);
    }
}
