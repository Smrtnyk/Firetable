import type { Canvas, FabricObject } from "fabric";

import { range } from "es-toolkit";
import { has } from "es-toolkit/compat";
import { Group, Line } from "fabric";

import { RESOLUTION } from "./constants.js";

declare module "fabric" {
    interface Group {
        isGridLine?: boolean;
    }
    interface GroupProps {
        isGridLine?: boolean;
    }
}

const LINE_OPTION = {
    evented: false,
    selectable: false,
    stroke: "#000",
    strokeDashArray: [3, 3],
    strokeUniform: true,
    strokeWidth: 0.5,
};

export class GridDrawer {
    isGridVisible = false;
    private readonly canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    clearGrid(): void {
        const { canvas } = this;
        this.getGridLines().forEach(function (obj) {
            canvas.remove(obj);
        });
        canvas.requestRenderAll();
    }

    drawGrid(width: number, height: number): void {
        this.clearGrid();
        const lines = this.createGridLines(width, height, RESOLUTION);
        this.addGridToCanvas(lines);
    }

    requestGridDraw(width: number, height: number): void {
        if (this.isGridVisible && this.getGridLines().length === 0) {
            this.drawGrid(width, height);
        }
    }

    toggleGridVisibility(width: number, height: number): void {
        if (this.isGridVisible) {
            this.clearGrid();
        } else {
            this.drawGrid(width, height);
        }
        this.isGridVisible = !this.isGridVisible;
    }

    private addGridToCanvas(lines: Line[]): void {
        const oGridGroup = new Group(lines, {
            evented: false,
            excludeFromExport: true,
            isGridLine: true,
            left: -0.25,
            selectable: false,
            top: -0.25,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendObjectToBack(oGridGroup);
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

    private getGridLines(): FabricObject[] {
        return this.canvas.getObjects().filter(function (obj) {
            return has(obj, "isGridLine");
        });
    }
}
