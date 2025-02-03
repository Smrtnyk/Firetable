import type { FabricObject } from "fabric";

import { Circle, classRegistry, FabricText, Group, LayoutManager, Rect } from "fabric";

import type { FloorEditorElement } from "../types.js";

import { FloorElementTypes } from "../types.js";

interface StageOptions {
    left: number;
    objects?: FabricObject[];
    top: number;
}

export class Stage extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.STAGE;

    constructor(options: StageOptions) {
        const stageBodyOpts = options.objects?.[0] ?? {};
        const stageBody = new Rect({
            evented: false,
            fill: "#222",
            height: 25 * 4,
            left: 0,
            rx: 10,
            ry: 10,
            stroke: "#111",
            strokeUniform: true,
            strokeWidth: 1,
            top: 0,
            width: 150,
            ...stageBodyOpts,
        });

        const decorOpts = options.objects?.[1] ?? {};
        const decor = new Rect({
            evented: false,
            fill: "#6247aa",
            height: 20,
            left: 35,
            top: stageBody.height - 25,
            width: 80,
            ...decorOpts,
        });

        const stageLabelOpts = options.objects?.[2] ?? {};
        const stageLabel = new FabricText("STAGE", {
            evented: false,
            fill: "#FFFFFF",
            fontSize: 20,
            fontWeight: "bold",
            left: stageBody.width / 2,
            originX: "center",
            originY: "center",
            top: stageBody.height / 2,
            ...stageLabelOpts,
        });

        // LEDs for the stage front
        // For even spacing
        const ledSpacingWidth = stageBody.width / 5;

        const ledsFront = Array.from({ length: 4 }).map(function (_, index) {
            const ledOpts = options.objects?.[index + 3] ?? {};
            return new Circle({
                evented: false,
                fill: "#3498DB",
                left: ledSpacingWidth * (index + 1),
                radius: 2,
                top: 2,
                ...ledOpts,
            });
        });

        super([stageBody, decor, stageLabel, ...ledsFront], {
            ...options,
            layoutManager: new LayoutManager(),
            subTargetCheck: false,
        });
    }

    static override fromObject(object: any): Promise<Stage> {
        return Promise.resolve(new Stage(object));
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // imp
    }
}

classRegistry.setClass(Stage);
