import type { CreateElementOptions } from "./types";
import { match } from "ts-pattern";
import { ElementTag } from "@firetable/types";
import { Wall } from "./elements/Wall";
import { DJBooth } from "./elements/DJBooth";
import { Sofa } from "./elements/Sofa";
import { RoundTable } from "./elements/RoundTable";
import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import { RectTable } from "./elements/RectTable";
import { SingleSofa } from "./elements/SingleSofa";
import { Stage } from "./elements/Stage";

export class ElementManager {
    addElement(
        options: CreateElementOptions,
    ): RectTable | RoundTable | Wall | Sofa | DJBooth | SingleSofa {
        return match(options.tag)
            .with(ElementTag.RECT, () => this.addRectTableElement(options))
            .with(ElementTag.CIRCLE, () => this.addRoundTableElement(options))
            .with(ElementTag.SOFA, () => this.addSofaElement(options))
            .with(ElementTag.SINGLE_SOFA, () => this.addSingleSofaElement(options))
            .with(ElementTag.DJ_BOOTH, () => this.addDJBooth(options))
            .with(ElementTag.WALL, () => this.addWall(options))
            .with(ElementTag.STAGE, () => this.addStageElement(options))
            .exhaustive();
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

    private addSingleSofaElement({ x, y }: CreateElementOptions): SingleSofa {
        return new SingleSofa({ left: x, top: y });
    }

    private addStageElement({ x, y }: CreateElementOptions): Stage {
        return new Stage(x, y);
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
        const table = new RectTable({
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
        return table;
    }

    private verifyLabel(label: string | undefined): asserts label {
        if (!label) {
            throw new Error("Cannot create element without a label!");
        }
    }
}
