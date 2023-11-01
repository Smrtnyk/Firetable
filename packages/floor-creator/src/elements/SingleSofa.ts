import { fabric } from "fabric";
import { FloorElementTypes } from "../types";
import { IGroupOptions } from "fabric/fabric-impl";

type SofaGroupCreationOpts = {
    top: number;
    left: number;
    objects?: fabric.Object[];
} & IGroupOptions;

export class SingleSofa extends fabric.Group {
    type = FloorElementTypes.SINGLE_SOFA;
    sofaBase: fabric.Rect;

    constructor(sofaGroupOpts: SofaGroupCreationOpts) {
        const sofaBaseOpts = sofaGroupOpts.objects?.[0] ?? {};
        const base = new fabric.Rect({
            width: 25 * 2,
            height: 25 / 1.5,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
            ...sofaBaseOpts,
            // Needs to stay like this all the time, otherwise element gets distorted
            left: 0,
            top: 0,
            rx: 4,
            ry: 4,
        });

        const backrest = new fabric.Rect({
            left: 0,
            top: -25 / 4,
            width: 25 * 2,
            height: 25 / 4,
            fill: "#444",
            stroke: "#222",
            strokeWidth: 0.5,
        });

        super([base, backrest], sofaGroupOpts);
        this.sofaBase = base;
    }

    static fromObject(object: any, callback: (obj: SingleSofa) => void): void {
        const instance = new SingleSofa(object);
        callback(instance);
    }

    getBaseFill(): string {
        return this.sofaBase.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.sofaBase.set("fill", val);
        this.canvas?.renderAll();
    }
}

// @ts-ignore Register the SingleSofa class with Fabric
fabric.SingleSofa = fabric.util.createClass(SingleSofa);
// @ts-ignore Register the SingleSofa class with Fabric
fabric.SingleSofa.fromObject = SingleSofa.fromObject;
