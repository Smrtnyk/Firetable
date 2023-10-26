import { fabric } from "fabric";
import { FloorElementTypes } from "../types";
import { IGroupOptions } from "fabric/fabric-impl";

type WallCreationOptions = Record<string, unknown>;
type WalLGroupCreationOptions = { left: number; top: number } & IGroupOptions;

export class Wall extends fabric.Group {
    type = FloorElementTypes.WALL;

    constructor(groupOpts: WalLGroupCreationOptions, wallRectOpts: WallCreationOptions = {}) {
        const wallRect = new fabric.Rect({
            width: 10,
            height: 100,
            fill: "#444",
            ...wallRectOpts,
        });

        super([wallRect], groupOpts);
    }

    toObject() {
        return {
            ...super.toObject(),
            objectCaching: false,
        };
    }

    static fromObject(object: any, callback: (obj: Wall) => void): void {
        const wallRect = object.objects[0];
        const instance = new Wall(object, wallRect);
        callback(instance);
    }
}

// @ts-ignore Register the Wall class with Fabric
fabric.Wall = fabric.util.createClass(Wall);
// @ts-ignore Register the Wall class with Fabric
fabric.Wall.fromObject = Wall.fromObject;
