import type { Canvas } from "fabric";
import type { HorizontalLine, VerticalLine } from "./types.js";
import { aligningLineColor, aligningLineWidth } from "./constant.js";
import { Point } from "fabric";

function drawLine(canvas: Canvas, origin: Point, target: Point): void {
    const ctx = canvas.getSelectionContext();
    const viewportTransform = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    ctx.save();
    ctx.transform(...viewportTransform);
    ctx.lineWidth = aligningLineWidth / zoom;
    ctx.strokeStyle = aligningLineColor;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    drawX(ctx, zoom, origin);
    drawX(ctx, zoom, target);
    ctx.restore();
}

const xSize = 2.4;
function drawX(ctx: CanvasRenderingContext2D, zoom: number, point: Point): void {
    const size = xSize / zoom;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(size, size);
    ctx.moveTo(size, -size);
    ctx.lineTo(-size, size);
    ctx.stroke();
    ctx.restore();
}
function drawPoint(canvas: Canvas, arr: Point[]): void {
    const ctx = canvas.getSelectionContext();
    const viewportTransform = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    ctx.save();
    ctx.transform(...viewportTransform);
    ctx.lineWidth = aligningLineWidth / zoom;
    ctx.strokeStyle = aligningLineColor;
    for (const item of arr) {
        drawX(ctx, zoom, item);
    }
    ctx.restore();
}
export function drawPointList(canvas: Canvas, list: Array<VerticalLine | HorizontalLine>): void {
    const arr = list.map((item) => {
        const isVertical = "y2" in item;
        const x = isVertical ? item.x : item.x1;
        const y = isVertical ? item.y1 : item.y;
        return new Point(x, y);
    });
    drawPoint(canvas, arr);
}

export function drawVerticalLine(canvas: Canvas, coords: VerticalLine): void {
    const x = coords.x;
    const origin = new Point(x, coords.y1);
    const target = new Point(x, coords.y2);
    drawLine(canvas, origin, target);
}

export function drawHorizontalLine(canvas: Canvas, coords: HorizontalLine): void {
    const y = coords.y;
    const origin = new Point(coords.x1, y);
    const target = new Point(coords.x2, y);
    drawLine(canvas, origin, target);
}
