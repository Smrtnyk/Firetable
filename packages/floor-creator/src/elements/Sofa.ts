import type { FabricObject, FabricObjectProps, GroupProps } from "fabric";

import { omit } from "es-toolkit";
import { classRegistry, Group, LayoutManager, Rect } from "fabric";

import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";

type SofaGroupCreationOpts = Partial<GroupProps> & {
    [key: string]: unknown;
    left: number;
    objects?: FabricObject[];
    top: number;
};

export class Sofa extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.SOFA;
    sofaBase: Rect;

    constructor(sofaGroupOpts: SofaGroupCreationOpts) {
        const sofaBaseOpts: Partial<FabricObjectProps> & { type?: string } =
            sofaGroupOpts.objects?.[0] ?? {};
        const sofaBaseOptsWithoutType = omit(sofaBaseOpts, ["type"]);
        const base = new Rect({
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            height: 25 / 1.5,
            stroke: "#222",
            strokeUniform: true,
            strokeWidth: 0.5,
            width: 25 * 4,
            ...sofaBaseOptsWithoutType,
            // Needs to stay like this all the time, otherwise element gets distorted
            left: 0,
            rx: 4,
            ry: 4,
            top: 0,
        });

        const backrest = new Rect({
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            height: 25 / 4,
            left: 0,
            stroke: "#222",
            strokeUniform: true,
            strokeWidth: 0.5,
            top: -25 / 4,
            width: 25 * 4,
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
    }
}

classRegistry.setClass(Sofa);
