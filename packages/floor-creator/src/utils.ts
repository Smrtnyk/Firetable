import type { Canvas, FabricObject } from "fabric";

export function calculateCanvasScale(
    containerWidth: number,
    containerHeight: number,
    floorWidth: number,
    floorHeight: number,
): number {
    if (containerWidth < containerHeight) {
        return containerWidth / floorWidth;
    }
    return containerHeight / floorHeight;
}

export function setElementAngle(object: FabricObject, angle: number): void {
    object.angle = angle;
    object.setCoords();
    object.fire("modified");
    object.canvas?.fire("object:modified", { target: object });
    object.canvas?.requestRenderAll();
}

export function setDimensions(
    object: FabricObject,
    dimensions: { width: number; height: number },
): void {
    object.scaleX = dimensions.width / object.width;
    object.scaleY = dimensions.height / object.height;
    object.setCoords();

    object.fire("scaling");
    object.fire("modified");
    object.canvas?.fire("object:modified", { target: object });

    object.canvas?.requestRenderAll();
}

export async function canvasToRender(canvas: Canvas): Promise<void> {
    await new Promise<unknown>(function (resolve) {
        canvas.requestRenderAll();
        canvas.once("after:render", resolve);
    });
}
