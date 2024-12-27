import type { FloorEditorElement } from "../types.js";
import type { FabricObject } from "fabric";
import { FloorElementTypes } from "../types.js";
import { DEFAULT_FONT, FONT_SIZE } from "../constants.js";
import { Circle, classRegistry, Group, IText, LayoutManager, Rect, util } from "fabric";

interface BarOptions {
    left: number;
    top: number;
    objects?: FabricObject[];
}

type BarDesign = {
    mainBody: Record<string, unknown>;
    extension?: Record<string, unknown>;
    accents: Record<string, unknown>[];
    glassDisplays?: boolean;
    leds?: {
        colors: string[];
        count: number;
    };
};

const BAR_DESIGNS: BarDesign[] = [
    {
        // Center Island Circle Bar
        mainBody: {
            width: 200,
            height: 200,
            fill: "#202020",
            rx: 100,
            ry: 100,
            circle: true,
        },
        accents: [
            // Large service well
            {
                left: 40,
                top: 40,
                width: 120,
                height: 120,
                fill: "#282828",
                rx: 60,
                ry: 60,
            },
            // Three speed rails at 120° intervals
            {
                left: 85,
                top: 30,
                width: 30,
                height: 15,
                fill: "#181818",
            },
            {
                left: 40,
                top: 140,
                width: 30,
                height: 15,
                fill: "#181818",
            },
            {
                left: 130,
                top: 140,
                width: 30,
                height: 15,
                fill: "#181818",
            },
        ],
        leds: {
            colors: ["#ff3838"],
            count: 12,
        },
    },
    {
        // Compact Corner Rectangle
        mainBody: {
            width: 180,
            height: 70,
            fill: "#202020",
        },
        accents: [
            // Main service area
            {
                left: 15,
                top: 15,
                width: 150,
                height: 40,
                fill: "#282828",
            },
            // Large speed rail
            {
                left: 20,
                top: 5,
                width: 140,
                height: 12,
                fill: "#181818",
            },
            // Ice well
            {
                left: 25,
                top: 20,
                width: 35,
                height: 30,
                fill: "#181818",
            },
        ],
    },
    {
        // Rounded VIP Bar
        mainBody: {
            width: 200,
            height: 75,
            fill: "#202020",
            rx: 37.5,
            ry: 37.5,
        },
        accents: [
            // Curved service area
            {
                left: 20,
                top: 15,
                width: 160,
                height: 45,
                fill: "#282828",
                rx: 22.5,
                ry: 22.5,
            },
            // Elegant speed rail
            {
                left: 25,
                top: 5,
                width: 150,
                height: 10,
                fill: "#181818",
            },
            // Central ice well
            {
                left: 85,
                top: 20,
                width: 30,
                height: 35,
                fill: "#181818",
            },
        ],
        leds: {
            colors: ["#ffedbc"],
            count: 10,
        },
    },
    {
        // L-Shaped Bar - maximizes corner space
        mainBody: {
            width: 160,
            height: 60,
            fill: "#202020",
        },
        extension: {
            left: 120,
            top: -50,
            width: 40,
            height: 110,
            fill: "#202020",
        },
        accents: [
            // Main service well
            {
                left: 15,
                top: 15,
                width: 95,
                height: 35,
                fill: "#282828",
            },
            // L-shaped speed rail
            {
                left: 20,
                top: 5,
                width: 90,
                height: 10,
                fill: "#181818",
            },
        ],
        leds: {
            colors: ["#7d5fff"],
            count: 10,
        },
    },
];

export class Bar extends Group implements FloorEditorElement {
    static override readonly type = FloorElementTypes.BAR;
    label = "BAR";
    private barBody: Rect;
    private textLabel: IText;
    private currentDesignIndex = 0;
    private readonly ledAnimationFrame = -1;

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
            ...options,
            layoutManager: new LayoutManager(),
            interactive: true,
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

    private static createInitialDesign(design: BarDesign, label = "BAR"): FabricObject[] {
        const objects: FabricObject[] = [];

        const barBody = new Rect({
            left: 0,
            top: 0,
            stroke: "#333333",
            strokeWidth: 1,
            strokeUniform: true,
            evented: false,
            ...design.mainBody,
        });
        objects.push(barBody);

        if (design.extension) {
            const extension = new Rect({
                ...design.extension,
                stroke: "#333333",
                strokeWidth: 1,
                strokeUniform: true,
                evented: false,
            });
            objects.push(extension);
        }

        design.accents.forEach((accent: any) => {
            const accentObj = new Rect({
                ...accent,
                strokeWidth: 0,
                evented: false,
            });
            objects.push(accentObj);
        });

        const textLabel = new IText(label, {
            left: barBody.width / 2,
            top: barBody.height / 2,
            fontFamily: DEFAULT_FONT,
            fontSize: FONT_SIZE,
            fill: "#ffffff",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            textAlign: "center",
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

    private static createGlassDisplays(barBody: Rect): FabricObject[] {
        // Calculate spacing based on bar width
        const displayCount = 5;
        // Use 80% of bar width
        const spacing = (barBody.width * 0.8) / (displayCount - 1);
        // Start at 10% of bar width
        const startX = barBody.width * 0.1;

        return Array.from({ length: displayCount }).map((_, index) => {
            return new Circle({
                left: startX + index * spacing,
                // Position at 20% from top
                top: barBody.height * 0.2,
                radius: 3,
                fill: "#333333",
                stroke: "#444444",
                strokeWidth: 1,
                strokeUniform: true,
                evented: false,
            });
        });
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
                    left: x,
                    top: y,
                    radius: 1.5,
                    fill: color,
                    opacity: 0.8,
                    strokeWidth: 0,
                    evented: false,
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
                        left: x,
                        top: height - 2,
                        radius: 1.5,
                        fill: color,
                        opacity: 0.8,
                        strokeWidth: 0,
                        evented: false,
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
                left: index * spacing,
                top: height - 2,
                radius: 1.5,
                fill: color,
                opacity: 0.8,
                strokeWidth: 0,
                evented: false,
            });
        });
    }

    override toObject(propertiesToInclude: any[] = []): any {
        return {
            ...super.toObject(propertiesToInclude),
            currentDesignIndex: this.currentDesignIndex,
            label: this.label,
        };
    }

    setDimensions(width: number, height: number): void {
        this.scaleX = width / this.width;
        this.scaleY = height / this.height;
        this.setCoords();
        this.handleScaling();
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return this.barBody.get("fill") as string;
    }

    setBaseFill(val: string): void {
        this.barBody.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    flip(): void {
        this.set("flipX", !this.flipX);
        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    nextDesign(): void {
        cancelAnimationFrame(this.ledAnimationFrame);
        this.currentDesignIndex = (this.currentDesignIndex + 1) % BAR_DESIGNS.length;
        const design = BAR_DESIGNS[this.currentDesignIndex];
        // Store current transformations and properties
        const groupTransformations = {
            left: this.left,
            top: this.top,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            angle: this.angle,
            flipX: this.flipX,
            flipY: this.flipY,
            skewX: this.skewX,
            skewY: this.skewY,
            originX: this.originX,
            originY: this.originY,
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

    private handleScaling(): void {
        this.textLabel.set({
            scaleX: 1 / this.scaleX,
            scaleY: 1 / this.scaleY,
        });
        this.canvas?.requestRenderAll();
    }
}

classRegistry.setClass(Bar);
