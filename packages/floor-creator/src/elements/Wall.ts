import type { GroupProps } from "fabric";

import { omit } from "es-toolkit";
import { Group, LayoutManager, Rect } from "fabric";

import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = Partial<GroupProps> & {
    left: number;
    top: number;
    type?: string;
};

export class Wall extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.WALL;
    wallRect: Rect;

    constructor(groupOpts: WalLGroupCreationOptions, wallRectOpts: WallCreationOptions = {}) {
        const wallRectOptionsWithoutType = omit(wallRectOpts, ["type"]);
        const wallRect = new Rect({
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            height: 100,
            strokeUniform: true,
            width: 10,
            ...wallRectOptionsWithoutType,
            strokeWidth: 0,
        });

        wallRect.evented = false;

        const groupOptionsWithoutType = omit(groupOpts, ["type"]);
        super([wallRect], {
            ...groupOptionsWithoutType,
            layoutManager: new LayoutManager(),
            subTargetCheck: false,
        });
        this.wallRect = wallRect;
    }

    static override fromObject(object: any): Promise<Wall> {
        const wallRect = object.objects[0];
        return Promise.resolve(new Wall(object, wallRect));
    }

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
    }

    override toObject(): any {
        return super.toObject();
    }
}
