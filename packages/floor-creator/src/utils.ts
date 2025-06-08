import type { Canvas, FabricObject } from "fabric";

export function calculateCanvasScale(
    containerWidth: number,
    containerHeight: number,
    floorWidth: number,
    floorHeight: number,
): number {
    const scaleX = containerWidth / floorWidth;
    const scaleY = containerHeight / floorHeight;

    return Math.min(scaleX, scaleY);
}

export async function canvasToRender(canvas: Canvas): Promise<void> {
    await new Promise<unknown>(function (resolve) {
        canvas.requestRenderAll();
        canvas.once("after:render", resolve);
    });
}

export function setDimensions(
    object: FabricObject,
    dimensions: { height: number; width: number },
): void {
    object.scaleX = dimensions.width / object.width;
    object.scaleY = dimensions.height / object.height;
    object.setCoords();

    object.fire("scaling");
    object.fire("modified");
    object.canvas?.fire("object:modified", { target: object });

    object.canvas?.requestRenderAll();
}

export function setElementAngle(object: FabricObject, angle: number): void {
    object.angle = angle;
    object.setCoords();
    object.fire("modified");
    object.canvas?.fire("object:modified", { target: object });
    object.canvas?.requestRenderAll();
}

export function setElementPosition(object: FabricObject, left: number, top: number): void {
    object.left = left;
    object.top = top;
    object.setCoords();
    object.fire("modified");
    object.canvas?.fire("object:modified", { target: object });
    object.canvas?.requestRenderAll();
}
