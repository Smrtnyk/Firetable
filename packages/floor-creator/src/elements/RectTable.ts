import { fabric } from "fabric";
import { FloorElementTypes } from "../types.js";
import { determineTableColor } from "../utils.js";
import { Reservation } from "@firetable/types";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants";
import { IGroupOptions } from "fabric/fabric-impl";

interface RectTableElementOptions {
    groupOptions: {
        reservation?: Reservation;
        label: string;
    } & IGroupOptions;
    textOptions: {
        label: string;
    };
    rectOptions: Record<string, unknown>;
}

export class RectTable extends fabric.Group {
    type = FloorElementTypes.RECT_TABLE;
    reservation: Reservation | null = null;
    label: string;
    private isAnimating: boolean = false;
    private readonly initialStrokeWidth: number;
    private readonly initialFontSize: number;
    private readonly initialWidth: number;
    private readonly initialHeight: number;

    constructor(options: RectTableElementOptions) {
        const fill = determineTableColor(options.groupOptions.reservation);
        const tableRect = new fabric.Rect({
            ...options.rectOptions,
            fill,
            stroke: "black",
            strokeWidth: 2,
        });

        const textLabel = new fabric.Text(options.groupOptions.label, {
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            textAlign: "center",
            originX: "center",
            originY: "center",
            left: tableRect.left! + tableRect.width! / 2,
            top: tableRect.top! + tableRect.height! / 2,
        });

        super([tableRect, textLabel], options.groupOptions);

        this.initialWidth = tableRect.width!;
        this.initialHeight = tableRect.height!;
        this.label = options.groupOptions.label;
        if (options.groupOptions.reservation) this.reservation = options.groupOptions.reservation;

        this.initialStrokeWidth = tableRect.strokeWidth || 2;
        this.initialFontSize = textLabel.fontSize || FONT_SIZE;

        this.on("scaling", this.handleScaling.bind(this));
    }

    private handleScaling(): void {
        this.enforceStrokeWidth();
        this.resetFontSize();
        this.enforceMinimumDimensions();
    }

    private enforceMinimumDimensions(): void {
        if (!this.scaleX || !this.scaleY) return;

        if (this.scaleX * this.initialWidth < 50) {
            this.scaleX = 50 / this.initialWidth;
        }

        if (this.scaleY * this.initialHeight < 50) {
            this.scaleY = 50 / this.initialHeight;
        }
    }

    private enforceStrokeWidth(): void {
        const tableRect = this.item(0) as fabric.Rect;
        if (!this.scaleX || !this.scaleY) return;
        tableRect.set({
            strokeWidth: this.initialStrokeWidth / Math.max(this.scaleX, this.scaleY),
        });
    }

    private resetFontSize(): void {
        const textLabel = this.item(1) as unknown as fabric.Text;
        textLabel.set({
            fontSize: this.initialFontSize,
            left: (this.item(0) as fabric.Rect).left! + (this.item(0) as fabric.Rect).width! / 2, // Adjust position if necessary
            top: (this.item(0) as fabric.Rect).top! + (this.item(0) as fabric.Rect).height! / 2, // Adjust position if necessary
        });
    }

    startSmoothBlinking() {
        if (this.isAnimating) return; // Already animating

        this.isAnimating = true;
        this.smoothBlink();
    }

    private smoothBlink() {
        if (!this.isAnimating) return;

        this.animate("opacity", 0, {
            duration: 500, // Adjust as necessary
            onChange: this.canvas?.renderAll.bind(this.canvas), // Bind necessary if inside class
            onComplete: () => {
                this.animate("opacity", 1, {
                    duration: 500, // Adjust as necessary
                    onChange: this.canvas?.renderAll.bind(this.canvas), // Bind necessary if inside class
                    onComplete: () => {
                        this.smoothBlink(); // Loop the animation
                    },
                });
            },
        });
    }

    stopSmoothBlinking() {
        this.isAnimating = false;
        // @ts-ignore
        this.set({ opacity: 1 }); // Ensure it's fully visible when animation stops
        this.canvas?.renderAll(); // Re-render canvas to apply opacity change
    }

    toObject() {
        return {
            ...super.toObject(),
            label: this.label,
            reservation: this.reservation,
            objectCaching: false,
        };
    }

    static fromObject(object: any, callback: (obj: RectTable) => void): void {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        const instance = new RectTable({
            groupOptions: object,
            rectOptions: rectOpts,
            textOptions: textOpts,
        });
        callback(instance);
    }
}

// @ts-ignore: Unreachable code error
fabric.RectTable = fabric.util.createClass(RectTable);
