import type { FabricObject } from "fabric";
import { FloorElementTypes, type FloorEditorElement } from "../types.js";
import {
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    ELEMENT_DEFAULT_STROKE_WIDTH,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants.js";
import { Point, classRegistry, Group, IText, LayoutManager, Rect } from "fabric";

interface CloakroomOptions {
    left: number;
    top: number;
    objects?: [
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        FabricObject,
        IText,
    ];
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
            width,
            height,
            fill: ELEMENT_DEFAULT_FILL_COLOR,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: ELEMENT_DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
            evented: false,
            ...counterOpts,
        });

        const hooks: Rect[] = [];
        const hookSpacing = width / 6;

        // Create hooks using existing objects or new ones
        for (let i = 0; i < 5; i++) {
            const hookOpts = options.objects?.[i + 1] ?? {};
            const hook = new Rect({
                left: (i + 1) * hookSpacing,
                top: 5,
                width: 4,
                height: 10,
                fill: "#333333",
                strokeWidth: 0,
                evented: false,
                ...hookOpts,
            });
            hooks.push(hook);
        }

        const iTextInstance = options.objects?.[6];
        const textLabel = new IText(iTextInstance?.text ?? "Cloakroom", {
            left: iTextInstance?.left ?? 0,
            top: iTextInstance?.top ?? 0,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            textAlign: "center",
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
            layoutManager: new LayoutManager(),
            interactive: true,
            subTargetCheck: true,
        });

        this.label = "CLOAKROOM";
        this.counterBody = counter;
    }

    // @ts-expect-error -- seems like having proper return type here is a bit tricky
    static fromObject(object: any): Promise<Cloakroom> {
        return Promise.resolve(new Cloakroom(object));
    }

    // @ts-expect-error -- seems like having proper return type here is a bit tricky
    toObject(): Record<string, unknown> {
        return {
            ...super.toObject(),
            label: this.label,
        };
    }

    getBaseFill(): string {
        return this.counterBody.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.counterBody.set("fill", val);
    }
}

classRegistry.setClass(Cloakroom);
