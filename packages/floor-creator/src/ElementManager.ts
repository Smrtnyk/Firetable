import type { FabricObject } from "fabric";

import type { CreateElementOptions } from "./types.js";

import {
    DEFAULT_FONT,
    ELEMENT_DEFAULT_FILL_COLOR,
    RESOLUTION,
    TABLE_HEIGHT,
    TABLE_WIDTH,
} from "./constants.js";
import { Bar } from "./elements/Bar.js";
import { Cloakroom } from "./elements/Cloakroom.js";
import { DJBooth } from "./elements/DJBooth.js";
import { Door } from "./elements/Door.js";
import { EditableShape } from "./elements/EditableShape.js";
import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { Sofa } from "./elements/Sofa.js";
import { SpiralStaircase } from "./elements/SpiralStaircase.js";
import { Stage } from "./elements/Stage.js";
import { TextElement } from "./elements/TextElement.js";
import { Wall } from "./elements/Wall.js";
import { FloorElementTypes } from "./types.js";

export class ElementManager {
    private readonly elementFactories: Record<
        FloorElementTypes,
        (opts: CreateElementOptions) => FabricObject
    > = {
        [FloorElementTypes.BAR]: this.addBar.bind(this),
        [FloorElementTypes.CLOAKROOM]: this.addCloakroom.bind(this),
        [FloorElementTypes.DJ_BOOTH]: this.addDJBooth.bind(this),
        [FloorElementTypes.DOOR]: this.addDoor.bind(this),
        [FloorElementTypes.EDITABLE_CIRCLE]: this.addEditableCircle.bind(this),
        [FloorElementTypes.EDITABLE_RECT]: this.addEditableRect.bind(this),
        [FloorElementTypes.RECT_TABLE]: this.addRectTableElement.bind(this),
        [FloorElementTypes.ROUND_TABLE]: this.addRoundTableElement.bind(this),
        [FloorElementTypes.SOFA]: this.addSofaElement.bind(this),
        [FloorElementTypes.SPIRAL_STAIRCASE]: this.addSpiralStaircaseElement.bind(this),
        [FloorElementTypes.STAGE]: this.addStageElement.bind(this),
        [FloorElementTypes.TEXT]: this.addTextElement.bind(this),
        [FloorElementTypes.WALL]: this.addWall.bind(this),
    };

    public addElement(options: CreateElementOptions): FabricObject {
        const factoryFn = this.elementFactories[options.tag];

        if (!factoryFn) {
            throw new Error(`Unknown floor element type: ${options.tag}`);
        }

        return factoryFn(options);
    }

    private addBar({ x, y }: CreateElementOptions): Bar {
        return new Bar({ left: x, top: y });
    }

    private addCloakroom({ x, y }: CreateElementOptions): Cloakroom {
        return new Cloakroom({ left: x, top: y });
    }

    private addDJBooth({ x, y }: CreateElementOptions): DJBooth {
        return new DJBooth({ left: x, top: y });
    }

    private addDoor({ x, y }: CreateElementOptions): Door {
        return new Door({ left: x, top: y });
    }

    private addEditableCircle({ x, y }: CreateElementOptions): EditableShape {
        return EditableShape.create({
            shape: "circle",
            shapeOptions: {
                fill: ELEMENT_DEFAULT_FILL_COLOR,
                left: x,
                radius: 50,
                stroke: "black",
                strokeUniform: true,
                strokeWidth: 1,
                top: y,
            },
            text: "Editable on dbl click",
        });
    }

    private addEditableRect({ x, y }: CreateElementOptions): EditableShape {
        return EditableShape.create({
            shape: "rect",
            shapeOptions: {
                fill: ELEMENT_DEFAULT_FILL_COLOR,
                height: 100,
                left: x,
                stroke: "black",
                strokeUniform: true,
                strokeWidth: 1,
                top: y,
                width: 100,
            },
            text: "Editable on dbl click",
        });
    }

    private addRectTableElement({ label, x, y }: CreateElementOptions): RectTable {
        this.verifyLabel(label);
        return new RectTable({
            groupOptions: {
                label,
                left: x,
                top: y,
            },
            shapeOptions: {
                height: TABLE_HEIGHT,
                width: TABLE_WIDTH,
            },
            textOptions: {
                label,
            },
        });
    }

    private addRoundTableElement({ label, x, y }: CreateElementOptions): RoundTable {
        this.verifyLabel(label);
        const table = new RoundTable({
            groupOptions: {
                label,
            },
            shapeOptions: {
                radius: RESOLUTION,
            },
            textOptions: { label },
        });
        table.set({ left: x, top: y });
        return table;
    }

    private addSofaElement({ x, y }: CreateElementOptions): Sofa {
        return new Sofa({ left: x, top: y });
    }

    private addSpiralStaircaseElement({ x, y }: CreateElementOptions): SpiralStaircase {
        return new SpiralStaircase(x, y);
    }

    private addStageElement({ x, y }: CreateElementOptions): Stage {
        return new Stage({ left: x, top: y });
    }

    private addTextElement({ x, y }: CreateElementOptions): TextElement {
        return new TextElement({
            fill: "#ccc",
            fontFamily: DEFAULT_FONT,
            fontSize: 36,
            left: x,
            strokeWidth: 0,
            text: "Text",
            top: y,
        });
    }

    private addWall({ x, y }: CreateElementOptions): Wall {
        return new Wall({ left: x, top: y });
    }

    private verifyLabel(label: string | undefined): asserts label {
        if (!label) {
            throw new Error("Cannot create element without a label!");
        }
    }
}
