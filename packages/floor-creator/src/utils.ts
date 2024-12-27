import type { FabricObject } from "fabric";

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
    object.canvas?.requestRenderAll();
}

export function setDimensions(
    object: FabricObject,
    dimensions: { width: number; height: number },
): void {
    object.scaleX = dimensions.width / object.width;
    object.scaleY = dimensions.height / object.height;
    object.setCoords();
    object.canvas?.requestRenderAll();
}
