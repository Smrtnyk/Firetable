import type { FabricObject } from "fabric";

import { classRegistry, Group, IText, LayoutManager, Point, Rect } from "fabric";

import {
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    ELEMENT_DEFAULT_STROKE_WIDTH,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants.js";
import { type FloorEditorElement, FloorElementTypes } from "../types.js";

interface CloakroomOptions {
    left: number;
    objects?: [
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        IText,
    ];
    top: number;
}

export class Cloakroom extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.CLOAKROOM;
    label: string;
    private readonly counterBody: Rect;

    constructor(options: CloakroomOptions) {
        const width = 120;
        const height = 60;

        // If we have existing objects, use those, otherwise create fresh ones
        const counterOpts = options.objects?.[0] ?? {};
        const counter = new Rect({
            evented: false,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            height,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeUniform: true,
            strokeWidth: ELEMENT_DEFAULT_STROKE_WIDTH,
            width,
            ...counterOpts,
        });

        const hooks: Rect[] = [];
        const hookSpacing = width / 6;

        // Create hooks using existing objects or new ones
        for (let i = 0; i < 5; i++) {
            const hookOpts = options.objects?.[i + 1] ?? {};
            const hook = new Rect({
                evented: false,
                fill: "#333333",
                height: 10,
                left: (i + 1) * hookSpacing,
                strokeWidth: 0,
                top: 5,
                width: 4,
                ...hookOpts,
            });
            hooks.push(hook);
        }

        const iTextInstance = options.objects?.[6];
        const textLabel = new IText(iTextInstance?.text ?? "Cloakroom", {
            fill: TABLE_TEXT_FILL_COLOR,
            fontSize: FONT_SIZE,
            left: iTextInstance?.left ?? 0,
            textAlign: "center",
            top: iTextInstance?.top ?? 0,
        });
        if (!iTextInstance) {
            textLabel.setPositionByOrigin(
                new Point(counter.width / 2, counter.height / 2),
                "center",
                "center",
            );
        }

        super([counter, ...hooks, textLabel], {
            ...options,
            interactive: true,
            layoutManager: new LayoutManager(),
            subTargetCheck: true,
        });

        this.label = "CLOAKROOM";
        this.counterBody = counter;
    }

    // @ts-expect-error -- seems like having proper return type here is a bit tricky
    static fromObject(object: any): Promise<Cloakroom> {
        return Promise.resolve(new Cloakroom(object));
    }

    getBaseFill(): string {
        return this.counterBody.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.counterBody.set("fill", val);
    }

    // @ts-expect-error -- seems like having proper return type here is a bit tricky
    toObject(): Record<string, unknown> {
        return {
            ...super.toObject(),
            label: this.label,
        };
    }
}

classRegistry.setClass(Cloakroom);
