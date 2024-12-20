import type { GroupProps } from "fabric";
import { Table } from "./Table.js";
import {
    DEFAULT_FONT,
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants.js";
import { FloorElementTypes } from "../types.js";
import { Circle, FabricText } from "fabric";

interface CircleTableElementOptions {
    groupOptions: Partial<GroupProps> & {
        baseFill?: string;
        label: string;
    };
    textOptions: {
        label: string;
    };
    shapeOptions: Record<string, unknown>;
}

// @ts-expect-error -- not sure why this is an error
export class RoundTable extends Table {
    static override readonly type = FloorElementTypes.ROUND_TABLE;

    constructor(options: CircleTableElementOptions) {
        const tableCircle = new Circle({
            ...options.shapeOptions,
            originX: "center",
            originY: "center",
            fill: options.groupOptions.baseFill ?? ELEMENT_DEFAULT_FILL_COLOR,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: 0.5,
            strokeUniform: true,
        });
        const textLabel = new FabricText(options.groupOptions.label, {
            ...options.textOptions,
            fontSize: FONT_SIZE,
            fontFamily: DEFAULT_FONT,
            fill: TABLE_TEXT_FILL_COLOR,
            left: tableCircle.left,
            top: tableCircle.top,
            textAlign: "center",
            originX: "center",
            originY: "center",
        });
        super([tableCircle, textLabel], options);
    }

    static override fromObject(object: any): Promise<RoundTable> {
        const shapeOptions = object.objects[0];
        const textOptions = object.objects[1];
        return Promise.resolve(
            new RoundTable({
                groupOptions: object,
                shapeOptions,
                textOptions,
            }),
        );
    }
}
