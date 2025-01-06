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
import { omit } from "es-toolkit";

interface RectTableElementOptions {
    groupOptions: Partial<GroupProps> & {
        baseFill?: string;
        label: string;
    };
    textOptions: {
        [key: string]: unknown;
        label: string;
    };
    shapeOptions: Record<string, unknown>;
}

// @ts-expect-error -- not sure why this is an error
export class RectTable extends Table {
    static override readonly type = FloorElementTypes.RECT_TABLE;

    constructor(options: RectTableElementOptions) {
        const shapeOptions = omit(options.shapeOptions, ["type"]);
        const tableRect = new Rect({
            ...shapeOptions,
            fill: options.groupOptions.baseFill ?? ELEMENT_DEFAULT_FILL_COLOR,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeWidth: ELEMENT_DEFAULT_STROKE_WIDTH,
            strokeUniform: true,
            rx: 2,
            ry: 2,
            strokeLineJoin: "round",
        });

        const textOptions = omit(options.textOptions, ["type"]);
        const textLabel = new FabricText(options.groupOptions.label, {
            ...textOptions,
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

    static override fromObject(object: any): Promise<RectTable> {
        const rectOpts = object.objects[0];
        const textOpts = object.objects[1];
        return Promise.resolve(
            new RectTable({
                groupOptions: object,
                shapeOptions: rectOpts,
                textOptions: textOpts,
            }),
        );
    }
}
