import type { GroupProps } from "fabric";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
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
            ...wallRectOpts,
        });

        super([wallRect], {
            ...groupOpts,
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

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
        this.canvas?.requestRenderAll();
    }
}
