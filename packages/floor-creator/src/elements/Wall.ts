import { fabric } from "fabric";
import { FloorElementTypes } from "../types";
import { IGroupOptions } from "fabric/fabric-impl";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = {
    left: number;
    top: number;
} & IGroupOptions;

export class Wall extends fabric.Group {
    type = FloorElementTypes.WALL;
    wallRect: fabric.Rect;

    constructor(groupOpts: WalLGroupCreationOptions, wallRectOpts: WallCreationOptions = {}) {
        const wallRect = new fabric.Rect({
            width: 10,
            height: 100,
            fill: "#444",
            ...wallRectOpts,
            objectCaching: true,
        });

        super([wallRect], groupOpts);
        this.wallRect = wallRect;
        this.objectCaching = true;
    }

    getBaseFill(): string {
        return this.wallRect.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.wallRect.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    toObject(): void {
        return {
            ...super.toObject(),
            objectCaching: true,
        };
    }

    static fromObject(object: any, callback: (obj: Wall) => void): void {
        const wallRect = object.objects[0];
        const instance = new Wall({ ...object, objectCaching: true }, wallRect);
        callback(instance);
    }
}

// @ts-expect-error Register the Wall class with Fabric
fabric.Wall = fabric.util.createClass(Wall);
// @ts-expect-error Register the Wall class with Fabric
fabric.Wall.fromObject = Wall.fromObject;
