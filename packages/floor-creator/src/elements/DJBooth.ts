import type { FabricObject } from "fabric";

import { Circle, classRegistry, FabricText, Group, LayoutManager, Rect } from "fabric";

import type { FloorEditorElement } from "../types.js";

import { FloorElementTypes } from "../types.js";

interface DJBoothOptions {
    left: number;
    objects?: FabricObject[];
    top: number;
}

export class DJBooth extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.DJ_BOOTH;

    constructor(options: DJBoothOptions) {
        const bodyOpts = options.objects?.[0] ?? {};
        const body = new Rect({
            evented: false,
            fill: "#1C1C1C",
            height: 60,
            left: 0,
            rx: 15,
            ry: 15,
            top: 0,
            width: 120,
            ...bodyOpts,
        });

        const turntable1Opts = options.objects?.[1] ?? {};
        const turntable1 = new Circle({
            evented: false,
            fill: "#1C1C1C",
            left: 20,
            radius: 15,
            stroke: "#2F2F2F",
            strokeUniform: true,
            strokeWidth: 2,
            top: 20,
            ...turntable1Opts,
        });

        const turntable2Opts = options.objects?.[2] ?? {};
        const turntable2 = new Circle({
            evented: false,
            fill: "#1C1C1C",
            left: body.width - 20 - turntable1.width,
            radius: 15,
            stroke: "#2F2F2F",
            strokeUniform: true,
            strokeWidth: 2,
            top: 20,
            ...turntable2Opts,
        });

        const djSignOpts = options.objects?.[3] ?? {};
        const djSign = new FabricText("DJ", {
            evented: false,
            fill: "#FFFFFF",
            fontSize: 20,
            fontWeight: "bold",
            left: 50,
            top: 5,
            ...djSignOpts,
        });

        // dividing by total LEDs + 1 for even spacing
        const ledSpacing = body.width / 7;
        const leds = Array.from({ length: 6 }).map(function (_, index) {
            const ledOpts = options.objects?.[index + 4] ?? {};
            return new Circle({
                evented: false,
                fill: "#3498DB",
                left: ledSpacing * (index + 1),
                radius: 2,
                top: 57,
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
