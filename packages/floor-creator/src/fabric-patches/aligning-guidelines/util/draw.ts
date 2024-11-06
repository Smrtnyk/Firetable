import type { Canvas } from "fabric";
import type { LineProps } from "../typedefs.js";
import { aligningLineConfig } from "../constant.js";
import { Point } from "fabric";

function drawLine(canvas: Canvas, origin: Point, target: Point): void {
    const { width, color } = aligningLineConfig;
    const ctx = canvas.getSelectionContext();
    const viewportTransform = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    ctx.save();
    ctx.transform(...viewportTransform);
    ctx.lineWidth = width / zoom;
    ctx.strokeStyle = color;
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
    const { width, color } = aligningLineConfig;
    const ctx = canvas.getSelectionContext();
    const viewportTransform = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    ctx.save();
    ctx.transform(...viewportTransform);
    ctx.lineWidth = width / zoom;
    ctx.strokeStyle = color;
    for (const item of arr) drawX(ctx, zoom, item);
    ctx.restore();
}
export function drawPointList(canvas: Canvas, list: LineProps[]): void {
    const arr = list.map((item) => item.target);
    drawPoint(canvas, arr);
}

export function drawVerticalLine(canvas: Canvas, options: LineProps): void {
    const { origin, target } = options;
    const obj = new Point(target.x, origin.y);
    drawLine(canvas, obj, target);
}

export function drawHorizontalLine(canvas: Canvas, options: LineProps): void {
    const { origin, target } = options;
    const obj = new Point(origin.x, target.y);
    drawLine(canvas, obj, target);
}
