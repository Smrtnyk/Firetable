import type { FabricObject, FabricObjectProps, GroupProps } from "fabric";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { classRegistry, Group, LayoutManager, Rect } from "fabric";
import { omit } from "es-toolkit";

type SofaGroupCreationOpts = Partial<GroupProps> & {
    [key: string]: unknown;
    top: number;
    left: number;
    objects?: FabricObject[];
};

export class Sofa extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.SOFA;
    sofaBase: Rect;

    constructor(sofaGroupOpts: SofaGroupCreationOpts) {
        const sofaBaseOpts: Partial<FabricObjectProps> & { type?: string } =
            sofaGroupOpts.objects?.[0] ?? {};
        const sofaBaseOptsWithoutType = omit(sofaBaseOpts, ["type"]);
        const base = new Rect({
            width: 25 * 4,
            height: 25 / 1.5,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            stroke: "#222",
            strokeUniform: true,
            strokeWidth: 0.5,
            ...sofaBaseOptsWithoutType,
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

        const sofaGroupOptsWithoutType = omit(sofaGroupOpts, ["type"]);
        super([base, backrest], {
            ...sofaGroupOptsWithoutType,
            layoutManager: new LayoutManager(),
        });
        this.sofaBase = base;
    }

    static override fromObject(object: any): Promise<Sofa> {
        return Promise.resolve(new Sofa(object));
    }

    getBaseFill(): string {
        return this.sofaBase.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.sofaBase.set("fill", val);
        this.canvas?.requestRenderAll();
    }
}

classRegistry.setClass(Sofa);
