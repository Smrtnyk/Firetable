import { RESOLUTION } from "./constants";
import { Floor } from "./Floor";
import { fabric } from "fabric";

export class GridDrawer {
    private canvas: fabric.Canvas;
    private floor: Floor;

    constructor(canvas: fabric.Canvas, floor: Floor) {
        this.canvas = canvas;
        this.floor = floor;
    }

    drawGrid() {
        const gridSize = RESOLUTION;
        const width = this.floor.width;
        const height = this.floor.height;
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
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendToBack(oGridGroup);
    }
}
