import type { FabricObject, GroupProps } from "fabric";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";
import { ELEMENT_DEFAULT_FILL_COLOR } from "../constants.js";
import { classRegistry, Group, LayoutManager, Rect } from "fabric";

type SofaGroupCreationOpts = Partial<GroupProps> & {
    top: number;
    left: number;
    objects?: FabricObject[];
};

export class Sofa extends Group implements FloorEditorElement {
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

    static override fromObject(object: any): Promise<Sofa> {
        return Promise.resolve(new Sofa(object));
    }

    setDimensions(width: number, height: number): void {
        this.scaleX = width / this.width;
        this.scaleY = height / this.height;
        this.setCoords();
        this.canvas?.requestRenderAll();
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
