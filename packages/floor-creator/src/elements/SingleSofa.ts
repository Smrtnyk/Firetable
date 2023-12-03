import type { FabricObject, GroupProps } from "fabric";
import { FloorElementTypes } from "../types";
import { Rect, Group } from "fabric";

type SofaGroupCreationOpts = {
    top: number;
    left: number;
    objects?: FabricObject[];
} & Partial<GroupProps>;

export class SingleSofa extends Group {
    // @ts-expect-error -- deprecated
    type = FloorElementTypes.SINGLE_SOFA;
    sofaBase: Rect;

    constructor(sofaGroupOpts: SofaGroupCreationOpts) {
        const sofaBaseOpts = sofaGroupOpts.objects?.[0] ?? {};
        const base = new Rect({
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

        const backrest = new Rect({
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

    static async fromObject(object: any): Promise<SingleSofa> {
        return new SingleSofa(object);
    }

    getBaseFill(): string {
        return this.sofaBase.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.sofaBase.set("fill", val);
        this.canvas?.requestRenderAll();
    }
}
