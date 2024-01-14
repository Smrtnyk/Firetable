import type { CircleProps, FabricObject, GroupProps, RectProps } from "fabric";
import { FONT_SIZE, TABLE_TEXT_FILL_COLOR } from "../constants.js";
import { classRegistry, Group, FabricText, Rect, Circle } from "fabric";

type Editable = "rect" | "circle";

interface EditableShapeOptions<S extends Editable> {
    shape: S;
    shapeOptions: S extends "rect" ? Partial<RectProps> : Partial<CircleProps>;
    text: string;
}

export class EditableShape extends Group {
    private readonly textObj: FabricText;
    private readonly shape: FabricObject;
    label = "";

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

        const textObj = new FabricText(options.text, {
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

    constructor(objects: [FabricObject, FabricText], options?: Partial<GroupProps>) {
        super(objects, options);

        this.textObj = objects[1];
        this.shape = objects[0];
        this.label = this.textObj.get("text");
    }

    /**
     * Updates the text of the shape.
     * @param newText The new text to set.
     */
    setLabel(newText: string): void {
        this.textObj.set("text", newText);
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

classRegistry.setClass(EditableShape);
