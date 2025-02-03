import type { CircleProps, FabricObject, GroupProps, RectProps } from "fabric";

import { Circle, Group, IText, Rect } from "fabric";

import type { FloorEditorElement } from "../types.js";

import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants.js";

type Editable = "circle" | "rect";

interface EditableShapeOptions<S extends Editable> {
    shape: S;
    shapeOptions: S extends "rect" ? Partial<RectProps> : Partial<CircleProps>;
    text: string;
}

export class EditableShape extends Group implements FloorEditorElement {
    label = "";
    private readonly shape: FabricObject;
    private readonly textObj: IText;

    constructor(objects: [FabricObject, IText], options?: Partial<GroupProps>) {
        super(objects, {
            ...options,
            interactive: true,
            subTargetCheck: true,
        });

        this.textObj = objects[1];
        this.shape = objects[0];
        this.shape.evented = false;
        this.label = this.textObj.get("text");
    }

    static create<S extends Editable>(options: EditableShapeOptions<S>): EditableShape {
        let shape: FabricObject;
        switch (options.shape) {
            case "circle":
                shape = new Circle(options.shapeOptions);
                break;
            case "rect":
                shape = new Rect(options.shapeOptions);
                break;
            default:
                throw new Error("Unsupported shape type");
        }

        const textObj = new IText(options.text, {
            fill: TABLE_TEXT_FILL_COLOR,
            fontSize: FONT_SIZE,
            left: shape.left + shape.width / 2,
            originX: "center",
            originY: "center",
            textAlign: "center",
            top: shape.top + shape.height / 2,
        });

        return new EditableShape([shape, textObj], {});
    }

    getBaseFill(): string {
        return this.shape.get("fill");
    }

    setBaseFill(val: string): void {
        this.shape.set("fill", val);
    }
}
