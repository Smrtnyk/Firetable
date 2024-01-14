import type { GroupProps } from "fabric";
import { Table } from "./Table.js";
import {
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    ELEMENT_DEFAULT_STROKE_WIDTH,
} from "../constants.js";
import { FloorElementTypes } from "../types.js";
import { Rect, FabricText } from "fabric";

interface RectTableElementOptions {
    groupOptions: {
        baseFill?: string;
        label: string;
    } & Partial<GroupProps>;
    textOptions: {
        label: string;
    };
    shapeOptions: Record<string, unknown>;
}

// @ts-expect-error -- not sure why this is an error
export class RectTable extends Table {
    static override type = FloorElementTypes.RECT_TABLE;

    constructor(options: RectTableElementOptions) {
        const tableRect = new Rect({
            ...options.shapeOptions,
            fill: options.groupOptions.baseFill ?? ELEMENT_DEFAULT_FILL_COLOR,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: ELEMENT_DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
        });

        const textLabel = new FabricText(options.groupOptions.label, {
            ...options.textOptions,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
            textAlign: "center",
            originX: "center",
            originY: "center",
            left: tableRect.left + tableRect.width / 2,
            top: tableRect.top + tableRect.height / 2,
        });

        super([tableRect, textLabel], options);
        this.label = options.groupOptions.label;
    }

    static override async fromObject(object: any): Promise<RectTable> {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        return new RectTable({
            groupOptions: object,
            shapeOptions: rectOpts,
            textOptions: textOpts,
        });
    }
}
