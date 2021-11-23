import { select } from "d3-selection";
import { BaseFloorElement } from "src/types/floor";
import { drag } from "d3-drag";
import {
    calculateBottomResizableCirclePositionX,
    calculateBottomResizableCirclePositionY,
    getDefaultElementWidth,
    possibleXMove,
    possibleYMove,
} from "src/floor-manager/utils";
import { FTDragEvent } from "src/floor-manager/types";
import { isTable } from "src/floor-manager/type-guards";
import type { Floor } from "src/floor-manager/Floor";

export function elementResizeBehavior(floorInstance: Floor, element: Element) {
    const node = floorInstance.floor?.node();
    if (!node) return;

    const circleG = select<Element, BaseFloorElement>(element);
    const dragBehaviour = drag<SVGCircleElement, BaseFloorElement, unknown>()
        .container(node)
        .subject(({ x, y }: { x: number; y: number }) => ({ x, y }))
        .on("drag", elementResizing);

    circleG
        .append("circle")
        .attr("class", "bottom-right")
        .attr("r", 5)
        .attr("cx", calculateBottomResizableCirclePositionX)
        .attr("cy", calculateBottomResizableCirclePositionY)
        .on("mouseenter mouseleave", resizerHover)
        .call(dragBehaviour);

    function elementResizing(event: FTDragEvent, d: BaseFloorElement) {
        const { x, y } = event;
        const gridX = possibleXMove(floorInstance.width + d.width, x, d.width);
        const gridY = possibleYMove(floorInstance.height + d.height, y, d.height);
        d.width = Math.max(gridX - d.x, getDefaultElementWidth(d));
        d.height = Math.max(gridY - d.y, getDefaultElementWidth(d));

        if (isTable(d)) {
            floorInstance.renderTableElements();
        } else {
            floorInstance.renderWallElements();
        }
        // To trigger the reactivity if vue component registers the handler
        floorInstance.elementClickHandler(floorInstance, { ...d });
    }
}

function resizerHover({ type, target }: MouseEvent) {
    const element = select(target as Element);
    const radius = type === "mouseenter" ? 6 : 5;

    element.attr("r", radius);
}
