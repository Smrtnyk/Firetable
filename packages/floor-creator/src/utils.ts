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
