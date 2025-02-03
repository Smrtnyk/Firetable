import type { GroupProps } from "fabric";

import { omit } from "es-toolkit";
import { FabricText, Rect } from "fabric";

import {
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    ELEMENT_DEFAULT_STROKE_WIDTH,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants.js";
import { FloorElementTypes } from "../types.js";
import { Table } from "./Table.js";

interface RectTableElementOptions {
    groupOptions: Partial<GroupProps> & {
        baseFill?: string;
        label: string;
    };
    shapeOptions: Record<string, unknown>;
    textOptions: {
        [key: string]: unknown;
        label: string;
    };
}

// @ts-expect-error -- not sure why this is an error
export class RectTable extends Table {
    static override readonly type = FloorElementTypes.RECT_TABLE;

    constructor(options: RectTableElementOptions) {
        const shapeOptions = omit(options.shapeOptions, ["type"]);
        const tableRect = new Rect({
            ...shapeOptions,
            fill: options.groupOptions.baseFill ?? ELEMENT_DEFAULT_FILL_COLOR,
            rx: 2,
            ry: 2,
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeLineJoin: "round",
            strokeUniform: true,
            strokeWidth: ELEMENT_DEFAULT_STROKE_WIDTH,
        });

        const textOptions = omit(options.textOptions, ["type"]);
        const textLabel = new FabricText(options.groupOptions.label, {
            ...textOptions,
            fill: TABLE_TEXT_FILL_COLOR,
            fontSize: FONT_SIZE,
            left: tableRect.left + tableRect.width / 2,
            originX: "center",
            originY: "center",
            textAlign: "center",
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
