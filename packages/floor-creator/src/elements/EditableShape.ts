import type { CircleProps, FabricObject, GroupProps, RectProps } from "fabric";
import type { FloorEditorElement } from "../types.js";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants.js";
import { Group, Rect, Circle, IText } from "fabric";

type Editable = "circle" | "rect";

interface EditableShapeOptions<S extends Editable> {
    shape: S;
    shapeOptions: S extends "rect" ? Partial<RectProps> : Partial<CircleProps>;
    text: string;
}

export class EditableShape extends Group implements FloorEditorElement {
    label = "";
    private readonly textObj: IText;
    private readonly shape: FabricObject;

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
            case "rect":
                shape = new Rect(options.shapeOptions);
                break;
            case "circle":
                shape = new Circle(options.shapeOptions);
                break;
            default:
                throw new Error("Unsupported shape type");
        }

        const textObj = new IText(options.text, {
            originX: "center",
            originY: "center",
            fontSize: FONT_SIZE,
            textAlign: "center",
            fill: TABLE_TEXT_FILL_COLOR,
            left: shape.left + shape.width / 2,
            top: shape.top + shape.height / 2,
        });

        return new EditableShape([shape, textObj], {});
    }

    setDimensions(width: number, height: number): void {
        this.scaleX = width / this.width;
        this.scaleY = height / this.height;
        this.setCoords();
        this.canvas?.requestRenderAll();
    }

    setBaseFill(val: string): void {
        this.shape.set("fill", val);
        this.canvas?.requestRenderAll();
    }

    getBaseFill(): string {
        return this.shape.get("fill");
    }
}
