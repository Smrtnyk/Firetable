import type { FloorEditorElement } from "../types.js";
import type { FabricObject } from "fabric";
import { FloorElementTypes } from "../types.js";
import { LayoutManager, Circle, Group, Rect, FabricText, classRegistry } from "fabric";

interface DJBoothOptions {
    left: number;
    top: number;
    objects?: FabricObject[];
}

export class DJBooth extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.DJ_BOOTH;

    constructor(options: DJBoothOptions) {
        const bodyOpts = options.objects?.[0] ?? {};
        const body = new Rect({
            left: 0,
            top: 0,
            rx: 15,
            ry: 15,
            width: 120,
            height: 60,
            fill: "#1C1C1C",
            evented: false,
            ...bodyOpts,
        });

        const turntable1Opts = options.objects?.[1] ?? {};
        const turntable1 = new Circle({
            left: 20,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F",
            strokeWidth: 2,
            strokeUniform: true,
            evented: false,
            ...turntable1Opts,
        });

        const turntable2Opts = options.objects?.[2] ?? {};
        const turntable2 = new Circle({
            left: body.width - 20 - turntable1.width,
            top: 20,
            radius: 15,
            fill: "#1C1C1C",
            stroke: "#2F2F2F",
            strokeWidth: 2,
            strokeUniform: true,
            evented: false,
            ...turntable2Opts,
        });

        const djSignOpts = options.objects?.[3] ?? {};
        const djSign = new FabricText("DJ", {
            left: 50,
            top: 5,
            fontSize: 20,
            fill: "#FFFFFF",
            fontWeight: "bold",
            evented: false,
            ...djSignOpts,
        });

        // dividing by total LEDs + 1 for even spacing
        const ledSpacing = body.width / 7;
        const leds = Array.from({ length: 6 }).map(function (_, index) {
            const ledOpts = options.objects?.[index + 4] ?? {};
            return new Circle({
                left: ledSpacing * (index + 1),
                top: 57,
                radius: 2,
                fill: "#3498DB",
                evented: false,
                ...ledOpts,
            });
        });

        super([body, turntable1, turntable2, djSign, ...leds], {
            ...options,
            layoutManager: new LayoutManager(),
            subTargetCheck: false,
        });
    }

    static override fromObject(object: any): Promise<DJBooth> {
        return Promise.resolve(new DJBooth(object));
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // imp
    }
}

classRegistry.setClass(DJBooth);
