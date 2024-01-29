import type { FabricObject, GroupProps } from "fabric";
import { FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { Group, LayoutManager, Rect } from "fabric";

type SofaGroupCreationOpts = {
    top: number;
    left: number;
    objects?: FabricObject[];
} & Partial<GroupProps>;

export class Sofa extends Group {
    static override readonly type = FloorElementTypes.SOFA;
    sofaBase: Rect;

    constructor(sofaGroupOpts: SofaGroupCreationOpts) {
        const sofaBaseOpts = sofaGroupOpts.objects?.[0] ?? {};
        const base = new Rect({
            width: 25 * 4,
            height: 25 / 1.5,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            stroke: "#222",
            strokeUniform: true,
            strokeWidth: 0.5,
            ...sofaBaseOpts,
            // Needs to stay like this all the time, otherwise element gets distorted
            left: 0,
            top: 0,
            ry: 4,
            rx: 4,
        });

        const backrest = new Rect({
            left: 0,
            top: -25 / 4,
            width: 25 * 4,
            height: 25 / 4,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            stroke: "#222",
            strokeUniform: true,
            strokeWidth: 0.5,
        });

        super([base, backrest], {
            ...sofaGroupOpts,
            layoutManager: new LayoutManager(),
        });
        this.sofaBase = base;
    }

    static override async fromObject(object: any): Promise<Sofa> {
        return new Sofa(object);
    }

    getBaseFill(): string {
        return this.sofaBase.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.sofaBase.set("fill", val);
        this.canvas?.requestRenderAll();
    }
}
