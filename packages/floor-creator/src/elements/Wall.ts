import type { GroupProps } from "fabric/es";
import { FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { Group, LayoutManager, Rect } from "fabric/es";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = {
    left: number;
    top: number;
} & Partial<GroupProps>;

export class Wall extends Group {
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

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    override toObject(): any {
        return super.toObject();
    }

    static override async fromObject(object: any): Promise<Wall> {
        const wallRect = object.objects[0];
        return new Wall(object, wallRect);
    }
}
