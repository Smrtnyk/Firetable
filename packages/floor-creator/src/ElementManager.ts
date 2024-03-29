import type { CreateElementOptions } from "./types.js";
import type { FabricObject } from "fabric/es";
import { EditableShape } from "./elements/EditableShape.js";
import { FloorElementTypes } from "./types.js";
import { Wall } from "./elements/Wall.js";
import { DJBooth } from "./elements/DJBooth.js";
import { Sofa } from "./elements/Sofa.js";
import { RoundTable } from "./elements/RoundTable.js";
import { ELEMENT_DEFAULT_FILL_COLOR, RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants.js";
import { RectTable } from "./elements/RectTable.js";
import { Stage } from "./elements/Stage.js";
import { SpiralStaircase } from "./elements/SpiralStaircase.js";
import { Door } from "./elements/Door.js";
import { match } from "ts-pattern";

export class ElementManager {
    addElement(options: CreateElementOptions): FabricObject {
        return match(options.tag)
            .with(FloorElementTypes.RECT_TABLE, () => this.addRectTableElement(options))
            .with(FloorElementTypes.ROUND_TABLE, () => this.addRoundTableElement(options))
            .with(FloorElementTypes.SOFA, () => this.addSofaElement(options))
            .with(FloorElementTypes.DJ_BOOTH, () => this.addDJBooth(options))
            .with(FloorElementTypes.WALL, () => this.addWall(options))
            .with(FloorElementTypes.STAGE, () => this.addStageElement(options))
            .with(FloorElementTypes.SPIRAL_STAIRCASE, () => this.addSpiralStaircaseElement(options))
            .with(FloorElementTypes.DOOR, () => this.addDoor(options))
            .with(FloorElementTypes.EDITABLE_RECT, () => this.addEditableRect(options))
            .with(FloorElementTypes.EDITABLE_CIRCLE, () => this.addEditableCircle(options))
            .exhaustive();
    }

    private addEditableCircle({ x, y }: CreateElementOptions): EditableShape {
        return EditableShape.create({
            shape: "circle",
            shapeOptions: {
                radius: 50,
                stroke: "black",
                strokeWidth: 1,
                strokeUniform: true,
                fill: ELEMENT_DEFAULT_FILL_COLOR,
                top: y,
                left: x,
            },
            text: "Editable on dbl click",
        });
    }

    private addEditableRect({ x, y }: CreateElementOptions): EditableShape {
        return EditableShape.create({
            shape: "rect",
            shapeOptions: {
                width: 100,
                height: 100,
                stroke: "black",
                strokeWidth: 1,
                strokeUniform: true,
                fill: ELEMENT_DEFAULT_FILL_COLOR,
                top: y,
                left: x,
            },
            text: "Editable on dbl click",
        });
    }

    private addDoor({ x, y }: CreateElementOptions): Door {
        return new Door(x, y);
    }

    private addWall({ x, y }: CreateElementOptions): Wall {
        return new Wall({ left: x, top: y });
    }

    private addDJBooth({ x, y }: CreateElementOptions): DJBooth {
        return new DJBooth(x, y);
    }

    private addSofaElement({ x, y }: CreateElementOptions): Sofa {
        return new Sofa({ left: x, top: y });
    }

    private addStageElement({ x, y }: CreateElementOptions): Stage {
        return new Stage(x, y);
    }

    private addSpiralStaircaseElement({ x, y }: CreateElementOptions): SpiralStaircase {
        return new SpiralStaircase(x, y);
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

    private addRectTableElement({ label, x, y }: CreateElementOptions): RectTable {
        this.verifyLabel(label);
        return new RectTable({
            groupOptions: {
                label,
                left: x,
                top: y,
            },
            shapeOptions: {
                width: TABLE_WIDTH,
                height: TABLE_HEIGHT,
            },
            textOptions: {
                label,
            },
        });
    }

    private verifyLabel(label: string | undefined): asserts label {
        if (!label) {
            throw new Error("Cannot create element without a label!");
        }
    }
}
