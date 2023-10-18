import { RESOLUTION } from "./constants";
import { fabric } from "fabric";

export class GridDrawer {
    private canvas: fabric.Canvas;
    private isGridVisible = true;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    drawGrid(width: number, height: number) {
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
    ): fabric.Line[] {
        const lineOption = { stroke: "rgba(0,0,0,1)", strokeWidth: 1, selectable: false };
        const lines = [];

        for (let i = Math.ceil(width / gridSize); i--; ) {
            lines.push(new fabric.Line([gridSize * i, -top, gridSize * i, height], lineOption));
        }
        for (let i = Math.ceil(height / gridSize); i--; ) {
            lines.push(new fabric.Line([-left, gridSize * i, width, gridSize * i], lineOption));
        }

        return lines;
    }

    private addGridToCanvas(lines: fabric.Line[]): void {
        const oGridGroup = new fabric.Group(lines, {
            left: 0,
            top: 0,
            selectable: false,
            excludeFromExport: true,
            // @ts-ignore
            isGridLine: true,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendToBack(oGridGroup);
    }

    toggleGridVisibility = (width: number, height: number) => {
        if (this.isGridVisible) {
            this.clearGrid();
        } else {
            this.drawGrid(width, height);
        }
        this.isGridVisible = !this.isGridVisible;
    };

    clearGrid() {
        const objects = this.canvas.getObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
            // @ts-ignore
            if (objects[i].isGridLine) {
                // Assuming you've set a flag 'isGridLine' when drawing the grid
                this.canvas.remove(objects[i]);
            }
        }
        this.canvas.renderAll();
    }
}
