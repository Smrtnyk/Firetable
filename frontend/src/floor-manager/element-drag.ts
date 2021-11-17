import type { Floor } from "src/floor-manager/Floor";
import { select, Selection } from "d3-selection";
import { BaseFloorElement, TableElement } from "src/types/floor";
import { drag } from "d3-drag";
import { possibleXMove, possibleYMove } from "src/floor-manager/utils";
import { willCollide } from "src/floor-manager/collision-detection";

export function addDragBehaviourToElement(
    floorInstance: Floor,
    element:
        | Selection<SVGGElement, BaseFloorElement, SVGGElement, unknown>
        | Selection<SVGGElement, TableElement, SVGGElement, unknown>
) {
    const dragBehaviour = drag<Element, BaseFloorElement, Element>()
        .on("start", elementDragStarted)
        .on("drag", elementDragging)
        .on("end", elementDragEnded);

    dragBehaviour(element as any);

    function elementDragging(this: Element, { x, y }: DragEvent, d: BaseFloorElement) {
        const matchesSelectedElement = this === document.querySelector(".selected");

        if (!matchesSelectedElement) return;

        const gridX = possibleXMove(floorInstance.width, x, d.width);
        const gridY = possibleYMove(floorInstance.height, y, d.height);

        if (willCollide(floorInstance.data, d, gridX, gridY)) return;

        d.x = gridX;
        d.y = gridY;

        select(this).attr("transform", `translate(${gridX},${gridY})`);
    }
}

function elementDragStarted(this: Element): void {
    select(this).classed("active", true);
}

function elementDragEnded(this: Element): void {
    select(this).classed("active", false);
}
