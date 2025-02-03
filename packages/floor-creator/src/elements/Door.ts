import { omit } from "es-toolkit";
import { classRegistry, Group, LayoutManager, Line, Path } from "fabric";

import type { FloorEditorElement } from "../types.js";

import { ELEMENT_DEFAULT_STROKE_COLOR } from "../constants.js";
import { FloorElementTypes } from "../types.js";

interface DoorOptions {
    left: number;
    top: number;
    type?: string;
}

export class Door extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.DOOR;

    constructor(options: DoorOptions) {
        const doorLine = new Line([0, 0, 0, 50], {
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 5,
        });

        const doorArcPath = "M 0,0 Q 50,0, 50,50";
        const doorArc = new Path(doorArcPath, {
            fill: null,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeDashArray: [3, 3],
            strokeLineCap: "round",
            strokeLineJoin: "round",
            strokeWidth: 1,
        });

        doorLine.evented = false;
        doorArc.evented = false;

        super([doorLine, doorArc], {
            ...omit(options, ["type"]),
            layoutManager: new LayoutManager(),
            subTargetCheck: false,
        });
    }

    static override fromObject(object: any): Promise<Door> {
        return Promise.resolve(new Door(object));
    }

    flip(): void {
        // Store the current bounding rectangle before flipping
        const boundingRectBefore = this.getBoundingRect();

        // Flip the group horizontally
        this.set("flipX", !this.flipX);

        // Update the object's coordinates
        this.setCoords();

        // Store the bounding rectangle after flipping
        const boundingRectAfter = this.getBoundingRect();

        // Calculate the difference in the left position
        const deltaLeft = boundingRectBefore.left - boundingRectAfter.left;

        // Adjust the group's left position to compensate for the flip
        this.left += deltaLeft;

        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // impl
    }
}

classRegistry.setClass(Door);
