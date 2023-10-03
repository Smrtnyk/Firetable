import { CreateElementOptions } from "./types";
import { match } from "ts-pattern";
import { ElementTag } from "@firetable/types";
import { Wall } from "./elements/Wall";
import { DJBooth } from "./elements/DJBooth";
import { Sofa } from "./elements/Sofa";
import { RoundTable } from "./elements/RoundTable";
import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import { RectTable } from "./elements/RectTable";

interface ElementManagerOptions {
    isInEditorMode: boolean;
}

export class ElementManager {
    readonly isInEditorMode: boolean;

    constructor({ isInEditorMode }: ElementManagerOptions) {
        this.isInEditorMode = isInEditorMode;
    }

    addElement(options: CreateElementOptions) {
        return match(options.tag)
            .with(ElementTag.RECT, () => this.addRectTableElement(options))
            .with(ElementTag.CIRCLE, () => this.addRoundTableElement(options))
            .with(ElementTag.SOFA, () => this.addSofaElement(options))
            .with(ElementTag.DJ_BOOTH, () => this.addDJBooth(options))
            .with(ElementTag.WALL, () => this.addWall(options))
            .exhaustive();
    }

    private addWall({ x, y }: CreateElementOptions) {
        return new Wall(x, y);
    }

    private addDJBooth({ x, y }: CreateElementOptions) {
        return new DJBooth(x, y);
    }

    private addSofaElement({ x, y }: CreateElementOptions) {
        return new Sofa(x, y);
    }

    private addRoundTableElement({ label, x, y }: CreateElementOptions) {
        this.verifyLabel(label);
        const table = new RoundTable({
            groupOptions: {
                label,
                ...this.getElementLockingOptions(),
            },
            circleOptions: {
                radius: RESOLUTION,
            },
            textOptions: { label },
        });
        table.set({ left: x, top: y });
        return table;
    }

    private addRectTableElement({ label, x, y }: CreateElementOptions) {
        this.verifyLabel(label);
        return new RectTable({
            groupOptions: {
                label,
                left: x,
                top: y,
                ...this.getElementLockingOptions(),
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

    private getElementLockingOptions() {
        return {
            lockMovementX: this.shouldLockDrag(),
            lockMovementY: this.shouldLockDrag(),
        };
    }

    shouldLockDrag() {
        return !this.isInEditorMode;
    }
}
