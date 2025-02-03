import type { FabricObject } from "fabric";

import { omit } from "es-toolkit";
import { Circle, classRegistry, Group, IText, LayoutManager, Rect, util } from "fabric";

import type { FloorEditorElement } from "../types.js";

import { FONT_SIZE } from "../constants.js";
import { FloorElementTypes } from "../types.js";

type BarDesign = {
    accents: Record<string, unknown>[];
    extension?: Record<string, unknown>;
    glassDisplays?: boolean;
    leds?: {
        colors: string[];
        count: number;
    };
    mainBody: Record<string, unknown>;
};

interface BarOptions {
    left: number;
    objects?: FabricObject[];
    top: number;
    type?: string;
}

const BAR_DESIGNS: BarDesign[] = [
    {
        accents: [
            // Large service well
            {
                fill: "#282828",
                height: 120,
                left: 40,
                rx: 60,
                ry: 60,
                top: 40,
                width: 120,
            },
            // Three speed rails at 120° intervals
            {
                fill: "#181818",
                height: 15,
                left: 85,
                top: 30,
                width: 30,
            },
            {
                fill: "#181818",
                height: 15,
                left: 40,
                top: 140,
                width: 30,
            },
            {
                fill: "#181818",
                height: 15,
                left: 130,
                top: 140,
                width: 30,
            },
        ],
        leds: {
            colors: ["#ff3838"],
            count: 12,
        },
        // Center Island Circle Bar
        mainBody: {
            circle: true,
            fill: "#202020",
            height: 200,
            rx: 100,
            ry: 100,
            width: 200,
        },
    },
    {
        accents: [
            // Main service area
            {
                fill: "#282828",
                height: 40,
                left: 15,
                top: 15,
                width: 150,
            },
            // Large speed rail
            {
                fill: "#181818",
                height: 12,
                left: 20,
                top: 5,
                width: 140,
            },
            // Ice well
            {
                fill: "#181818",
                height: 30,
                left: 25,
                top: 20,
                width: 35,
            },
        ],
        // Compact Corner Rectangle
        mainBody: {
            fill: "#202020",
            height: 70,
            width: 180,
        },
    },
    {
        accents: [
            // Curved service area
            {
                fill: "#282828",
                height: 45,
                left: 20,
                rx: 22.5,
                ry: 22.5,
                top: 15,
                width: 160,
            },
            // Elegant speed rail
            {
                fill: "#181818",
                height: 10,
                left: 25,
                top: 5,
                width: 150,
            },
            // Central ice well
            {
                fill: "#181818",
                height: 35,
                left: 85,
                top: 20,
                width: 30,
            },
        ],
        leds: {
            colors: ["#ffedbc"],
            count: 10,
        },
        // Rounded VIP Bar
        mainBody: {
            fill: "#202020",
            height: 75,
            rx: 37.5,
            ry: 37.5,
            width: 200,
        },
    },
    {
        accents: [
            // Main service well
            {
                fill: "#282828",
                height: 35,
                left: 15,
                top: 15,
                width: 95,
            },
            // L-shaped speed rail
            {
                fill: "#181818",
                height: 10,
                left: 20,
                top: 5,
                width: 90,
            },
        ],
        extension: {
            fill: "#202020",
            height: 110,
            left: 120,
            top: -50,
            width: 40,
        },
        leds: {
            colors: ["#7d5fff"],
            count: 10,
        },
        // L-Shaped Bar - maximizes corner space
        mainBody: {
            fill: "#202020",
            height: 60,
            width: 160,
        },
    },
];

export class Bar extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.BAR;
    label = "BAR";
    private barBody: Rect;
    private currentDesignIndex = 0;
    private readonly ledAnimationFrame = -1;
    private textLabel: IText;

    constructor(options: BarOptions) {
        let objects: FabricObject[];

        // We come into this path if we are deserializing from the json
        // In that case fromObject provided enlivened instances through options.objects
        if (options.objects && options.objects.length > 0) {
            objects = options.objects;
            for (const object of objects) {
                if (object instanceof IText) {
                    object.evented = true;
                    continue;
                }
                object.evented = false;
            }
        } else {
            const designIndex = (options as any).currentDesignIndex ?? 0;
            const design = BAR_DESIGNS[designIndex];
            objects = Bar.createInitialDesign(design, (options as any).label);
        }

        super(objects, {
            ...omit(options, ["type"]),
            interactive: true,
            layoutManager: new LayoutManager(),
            subTargetCheck: true,
        });

        this.currentDesignIndex = (options as any).currentDesignIndex ?? 0;
        this.label = (options as any).label ?? "BAR";
        this.barBody = this.getObjects().find((obj) => obj instanceof Rect) as Rect;
        this.textLabel = this.getObjects().find((obj) => obj instanceof IText) as IText;

        this.on("scaling", this.handleScaling.bind(this));
    }

    static override async fromObject(object: any): Promise<Bar> {
        const objects = await util.enlivenObjects(object.objects);
        return new Bar({
            ...object,
            objects,
        });
    }

    private static createGlassDisplays(barBody: Rect): FabricObject[] {
        // Calculate spacing based on bar width
        const displayCount = 5;
        // Use 80% of bar width
        const spacing = (barBody.width * 0.8) / (displayCount - 1);
        // Start at 10% of bar width
        const startX = barBody.width * 0.1;

        return Array.from({ length: displayCount }).map((_, index) => {
            return new Circle({
                evented: false,
                fill: "#333333",
                left: startX + index * spacing,
                radius: 3,
                stroke: "#444444",
                strokeUniform: true,
                strokeWidth: 1,
                // Position at 20% from top
                top: barBody.height * 0.2,
            });
        });
    }

    private static createInitialDesign(design: BarDesign, label = "BAR"): FabricObject[] {
        const objects: FabricObject[] = [];

        const barBody = new Rect({
            evented: false,
            left: 0,
            stroke: "#333333",
            strokeUniform: true,
            strokeWidth: 1,
            top: 0,
            ...design.mainBody,
        });
        objects.push(barBody);

        if (design.extension) {
            const extension = new Rect({
                ...design.extension,
                evented: false,
                stroke: "#333333",
                strokeUniform: true,
                strokeWidth: 1,
            });
            objects.push(extension);
        }

        design.accents.forEach((accent: any) => {
            const accentObj = new Rect({
                ...accent,
                evented: false,
                strokeWidth: 0,
            });
            objects.push(accentObj);
        });

        const textLabel = new IText(label, {
            fill: "#ffffff",
            fontSize: FONT_SIZE,
            fontWeight: "bold",
            left: barBody.width / 2,
            originX: "center",
            originY: "center",
            textAlign: "center",
            top: barBody.height / 2,
        });
        objects.push(textLabel);

        if (design.glassDisplays) {
            objects.push(...Bar.createGlassDisplays(barBody));
        }

        if (design.leds) {
            objects.push(...Bar.createLeds(design.leds, barBody));
        }

        return objects;
    }

    private static createLeds(
        ledConfig: { colors: string[]; count: number },
        barBody: FabricObject,
    ): FabricObject[] {
        const width = barBody.width ?? 0;
        const height = barBody.height ?? 0;

        if ((barBody as any).circle) {
            const rx = (barBody as any).rx;
            const center = { x: rx, y: rx };

            return Array.from({ length: ledConfig.count }).map((_, index) => {
                const angle = (index / ledConfig.count) * Math.PI;
                const x = center.x + rx * Math.cos(angle);
                const y = center.y + rx * Math.sin(angle);

                const color = ledConfig.colors[index % ledConfig.colors.length];
                return new Circle({
                    evented: false,
                    fill: color,
                    left: x,
                    opacity: 0.8,
                    radius: 1.5,
                    strokeWidth: 0,
                    top: y,
                });
            });
        }

        // For rounded rectangles
        if ((barBody as any).rx) {
            const rx = (barBody as any).rx;
            const straightCount = Math.floor(ledConfig.count * 0.7);
            const leds: Circle[] = [];
            // Add LEDs to the front straight edge
            const straightSpacing = (width - 2 * rx) / (straightCount - 1);
            for (let i = 0; i < straightCount; i++) {
                const x = rx + i * straightSpacing;
                const color = ledConfig.colors[i % ledConfig.colors.length];
                leds.push(
                    new Circle({
                        evented: false,
                        fill: color,
                        left: x,
                        opacity: 0.8,
                        radius: 1.5,
                        strokeWidth: 0,
                        top: height - 2,
                    }),
                );
            }

            return leds;
        }

        // Straight bars
        const spacing = width / (ledConfig.count - 1);
        return Array.from({ length: ledConfig.count }).map((_, index) => {
            const color = ledConfig.colors[index % ledConfig.colors.length];
            return new Circle({
                evented: false,
                fill: color,
                left: index * spacing,
                opacity: 0.8,
                radius: 1.5,
                strokeWidth: 0,
                top: height - 2,
            });
        });
    }

    flip(): void {
        this.set("flipX", !this.flipX);
        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return this.barBody.get("fill") as string;
    }

    nextDesign(): void {
        cancelAnimationFrame(this.ledAnimationFrame);
        this.currentDesignIndex = (this.currentDesignIndex + 1) % BAR_DESIGNS.length;
        const design = BAR_DESIGNS[this.currentDesignIndex];
        // Store current transformations and properties
        const groupTransformations = {
            angle: this.angle,
            flipX: this.flipX,
            flipY: this.flipY,
            left: this.left,
            originX: this.originX,
            originY: this.originY,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            skewX: this.skewX,
            skewY: this.skewY,
            top: this.top,
        };
        const currentText = this.textLabel.get("text");

        // Remove all existing objects
        this.remove(...this.getObjects());
        // Create new design objects with current label
        const objects = Bar.createInitialDesign(design, currentText);
        // Add all objects at once
        this.add(...objects);
        // Restore transformations and properties
        this.set(groupTransformations);
        // Update references
        this.barBody = objects.find((obj) => obj instanceof Rect) as Rect;
        this.textLabel = objects.find((obj) => obj instanceof IText) as IText;
        this.handleScaling();
        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    setBaseFill(val: string): void {
        this.barBody.set("fill", val);
    }

    override toObject(propertiesToInclude: any[] = []): any {
        return {
            ...super.toObject(propertiesToInclude),
            currentDesignIndex: this.currentDesignIndex,
            label: this.label,
        };
    }

    private handleScaling(): void {
        this.textLabel.set({
            scaleX: 1 / this.scaleX,
            scaleY: 1 / this.scaleY,
        });
        this.canvas?.requestRenderAll();
    }
}

classRegistry.setClass(Bar);
