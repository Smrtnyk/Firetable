import { BaseFloorElement } from "src/types/floor";

export function willCollide(
    data: BaseFloorElement[],
    element: BaseFloorElement,
    nextXMove: number,
    nextYMove: number
) {
    const allElements = data.filter(({ id }) => element.id !== id);
    return allElements.some((currentElement) => {
        return (
            nextXMove + element.width > currentElement.x &&
            nextXMove < currentElement.x + currentElement.width &&
            nextYMove + element.height > currentElement.y &&
            nextYMove < currentElement.y + currentElement.height
        );
    });
}
