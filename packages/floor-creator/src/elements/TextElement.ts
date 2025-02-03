import type { ITextProps } from "fabric";

import { omit } from "es-toolkit";
import { classRegistry, IText } from "fabric";

import type { FloorEditorElement } from "../types.js";

type TextElementOptions = Partial<ITextProps> & {
    text: string;
    type?: string;
};

export class TextElement extends IText implements FloorEditorElement {
    label: string;

    constructor(options: TextElementOptions) {
        const { text, ...rest } = omit(options, ["type"]);
        super(text, rest);

        this.label = "TEXT";
    }

    static override fromObject(options: any): Promise<any> {
        return Promise.resolve(new TextElement(options));
    }

    getBaseFill(): string {
        return this.fill as string;
    }

    setBaseFill(val: string): void {
        this.set("fill", val);
    }
}

classRegistry.setClass(TextElement);
