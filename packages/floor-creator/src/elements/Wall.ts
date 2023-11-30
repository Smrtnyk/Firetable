import { Group, GroupProps, Rect } from "fabric";
import { FloorElementTypes } from "../types";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = {
    left: number;
    top: number;
} & Partial<GroupProps>;

export class Wall extends Group {
    // @ts-expect-error -- deprecated
    type = FloorElementTypes.WALL;
    wallRect: Rect;

    constructor(groupOpts: WalLGroupCreationOptions, wallRectOpts: WallCreationOptions = {}) {
        const wallRect = new Rect({
            width: 10,
            height: 100,
            fill: "#444",
            ...wallRectOpts,
        });

        super([wallRect], groupOpts);
        this.wallRect = wallRect;
    }

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    toObject(): any {
        return super.toObject();
    }

    static async fromObject(object: any): Promise<Wall> {
        const wallRect = object.objects[0];
        return new Wall(object, wallRect);
    }
}
