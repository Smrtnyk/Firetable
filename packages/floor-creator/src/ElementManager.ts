import type { CreateElementOptions } from "./types";
import { FloorElementTypes } from "./types";
import { Wall } from "./elements/Wall";
import { DJBooth } from "./elements/DJBooth";
import { Sofa } from "./elements/Sofa";
import { RoundTable } from "./elements/RoundTable";
import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import { RectTable } from "./elements/RectTable";
import { Stage } from "./elements/Stage";
import { SpiralStaircase } from "./elements/SpiralStaircase";
import { Door } from "./elements/Door";
import { match } from "ts-pattern";

export class ElementManager {
    addElement(
        options: CreateElementOptions,
    ): RectTable | RoundTable | Wall | Sofa | DJBooth | SpiralStaircase | Door {
        return match(options.tag)
            .with(FloorElementTypes.RECT_TABLE, () => this.addRectTableElement(options))
            .with(FloorElementTypes.ROUND_TABLE, () => this.addRoundTableElement(options))
            .with(FloorElementTypes.SOFA, () => this.addSofaElement(options))
            .with(FloorElementTypes.DJ_BOOTH, () => this.addDJBooth(options))
            .with(FloorElementTypes.WALL, () => this.addWall(options))
            .with(FloorElementTypes.STAGE, () => this.addStageElement(options))
            .with(FloorElementTypes.SPIRAL_STAIRCASE, () => this.addSpiralStaircaseElement(options))
            .with(FloorElementTypes.DOOR, () => this.addDoor(options))
            .exhaustive();
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
            circleOptions: {
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
            rectOptions: {
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
