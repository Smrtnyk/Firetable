import type { GroupProps } from "fabric";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR, ELEMENT_DEFAULT_STROKE_COLOR } from "../constants.js";
import { Group, LayoutManager, Rect } from "fabric";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = Partial<GroupProps> & {
    left: number;
    top: number;
};

export class Wall extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.WALL;
    wallRect: Rect;

    constructor(groupOpts: WalLGroupCreationOptions, wallRectOpts: WallCreationOptions = {}) {
        const wallRect = new Rect({
            width: 10,
            height: 100,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            strokeUniform: true,
            ...wallRectOpts,
            strokeWidth: 0,
        });

        wallRect.evented = false;

        super([wallRect], {
            ...groupOpts,
            subTargetCheck: false,
            layoutManager: new LayoutManager(),
        });
        this.wallRect = wallRect;
    }

    static override fromObject(object: any): Promise<Wall> {
        const wallRect = object.objects[0];
        return Promise.resolve(new Wall(object, wallRect));
    }

    override toObject(): any {
        return super.toObject();
    }

    changeToOutlinedMode(): void {
        this.wallRect.set({
            // Makes the background transparent
            fill: null,
            // Sets the stroke color
            stroke: ELEMENT_DEFAULT_STROKE_COLOR || "black",
            // Sets the stroke width to 1px
            strokeWidth: 1,
            // Creates a dashed stroke pattern
            strokeDashArray: [5, 5],
            strokeUniform: true,
        });
        // Re-render the canvas to reflect the changes
        this.canvas?.requestRenderAll();
    }

    changeToFilledMode(): void {
        this.wallRect.set({
            // Restores the fill color
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            // Removes the stroke
            stroke: null,
            // Resets the stroke width
            strokeWidth: 0,
            // Removes the dashed pattern
            strokeDashArray: null,
        });
        // Re-render the canvas to reflect the changes
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
        this.canvas?.requestRenderAll();
    }
}
