import type { FloorEditorElement } from "../types.js";
import type { FabricObject } from "fabric";
import { FloorElementTypes } from "../types.js";
import { DEFAULT_FONT } from "../constants.js";
import { LayoutManager, Group, Rect, FabricText, Circle, classRegistry } from "fabric";

interface StageOptions {
    left: number;
    top: number;
    objects?: FabricObject[];
}

export class Stage extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.STAGE;

    constructor(options: StageOptions) {
        const stageBodyOpts = options.objects?.[0] ?? {};
        const stageBody = new Rect({
            left: 0,
            top: 0,
            rx: 10,
            ry: 10,
            width: 150,
            height: 25 * 4,
            fill: "#222",
            stroke: "#111",
            strokeWidth: 1,
            strokeUniform: true,
            evented: false,
            ...stageBodyOpts,
        });

        const decorOpts = options.objects?.[1] ?? {};
        const decor = new Rect({
            left: 35,
            top: stageBody.height - 25,
            width: 80,
            height: 20,
            fill: "#6247aa",
            evented: false,
            ...decorOpts,
        });

        const stageLabelOpts = options.objects?.[2] ?? {};
        const stageLabel = new FabricText("STAGE", {
            left: stageBody.width / 2,
            top: stageBody.height / 2,
            fontFamily: DEFAULT_FONT,
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            evented: false,
            ...stageLabelOpts,
        });

        // LEDs for the stage front
        // For even spacing
        const ledSpacingWidth = stageBody.width / 5;

        const ledsFront = Array.from({ length: 4 }).map(function (_, index) {
            const ledOpts = options.objects?.[index + 3] ?? {};
            return new Circle({
                left: ledSpacingWidth * (index + 1),
                top: 2,
                radius: 2,
                fill: "#3498DB",
                evented: false,
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
