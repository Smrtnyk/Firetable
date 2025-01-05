import type { FloorEditorElement } from "../types.js";
import type { ITextProps } from "fabric";
import { IText, classRegistry } from "fabric";
import { debounce, omit } from "es-toolkit";

type TextElementOptions = Partial<ITextProps> & {
    text: string;
    type?: string;
};

export class TextElement extends IText implements FloorEditorElement {
    label: string;

    setBaseFill = debounce((val: string) => {
        this.set("fill", val);
        this.canvas?.fire("object:modified", { target: this });
        this.canvas?.requestRenderAll();
    }, 300);

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
}

classRegistry.setClass(TextElement);
