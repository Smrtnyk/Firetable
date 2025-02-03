import type { GroupProps } from "fabric";

import { omit } from "es-toolkit";
import { Circle, FabricText } from "fabric";

import {
    ELEMENT_DEFAULT_FILL_COLOR,
    ELEMENT_DEFAULT_STROKE_COLOR,
    FONT_SIZE,
    TABLE_TEXT_FILL_COLOR,
} from "../constants.js";
import { FloorElementTypes } from "../types.js";
import { Table } from "./Table.js";

interface CircleTableElementOptions {
    groupOptions: Partial<GroupProps> & {
        baseFill?: string;
        label: string;
    };
    shapeOptions: Record<string, unknown>;
    textOptions: {
        label: string;
        type?: string;
    };
}

// @ts-expect-error -- not sure why this is an error
export class RoundTable extends Table {
    static override readonly type = FloorElementTypes.ROUND_TABLE;

    constructor(options: CircleTableElementOptions) {
        const shapeOptions = omit(options.shapeOptions, ["type"]);
        const tableCircle = new Circle({
            ...shapeOptions,
            fill: options.groupOptions.baseFill ?? ELEMENT_DEFAULT_FILL_COLOR,
            originX: "center",
            originY: "center",
            stroke: ELEMENT_DEFAULT_STROKE_COLOR,
            strokeUniform: true,
            strokeWidth: 0.5,
        });
        const textLabel = new FabricText(options.groupOptions.label, {
            ...omit(options.textOptions, ["type"]),
            fill: TABLE_TEXT_FILL_COLOR,
            fontSize: FONT_SIZE,
            left: tableCircle.left,
            originX: "center",
            originY: "center",
            textAlign: "center",
            top: tableCircle.top,
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
