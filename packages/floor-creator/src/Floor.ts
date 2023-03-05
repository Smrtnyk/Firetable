import { fabric } from "fabric";
import { RectTable } from "./elements/RectTable.js";
import {
    CANVAS_BG_COLOR,
    FONT_SIZE,
    RESOLUTION,
    TABLE_HEIGHT,
    TABLE_TEXT_FILL_COLOR,
    TABLE_WIDTH,
} from "./constants.js";
import {
    BaseTable,
    CreateTableOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode,
} from "./types.js";
import { RoundTable } from "./elements/RoundTable.js";
import { ElementTag, FloorDoc, Reservation } from "@firetable/types";
import { match } from "ts-pattern";
import { createGroup } from "./factories.js";
import { InteractionsEngine } from "./engines/InteractionsEngine.js";
import { range } from "@firetable/utils";

interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorDoc;
    mode: FloorMode;
    dblClickHandler?: FloorDoubleClickHandler;
    elementClickHandler: ElementClickHandler;
    containerWidth: number;
}

Object.assign(fabric, {
    RectTable,
    RoundTable,
});

export class Floor {
    id: string;
    name: string;
    scale: number;
    width: number;
    height: number;
    mode: FloorMode;
    floorDoc: FloorDoc;
    containerWidth: number;
    canvas: fabric.Canvas | fabric.StaticCanvas;
    private interactionsEngine: InteractionsEngine;

    constructor({
        canvas,
        floorDoc,
        mode,
        containerWidth,
        elementClickHandler,
        dblClickHandler,
    }: FloorCreationOptions) {
        this.scale = calculateCanvasScale(containerWidth, floorDoc.width);
        this.width = floorDoc.width;
        this.height = floorDoc.height;
        this.containerWidth = containerWidth;
        this.floorDoc = floorDoc;
        this.canvas = new fabric.Canvas(canvas, {
            width: floorDoc.width,
            height: floorDoc.height,
            backgroundColor: CANVAS_BG_COLOR,
            interactive: mode === FloorMode.EDITOR,
        });
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.mode = mode;
        this.interactionsEngine = new InteractionsEngine(
            this,
            elementClickHandler,
            dblClickHandler
        );
        this.renderData(floorDoc.json);
    }

    elementReviver = (o: string, object: fabric.Object) => {
        object.on("mouseup", this.interactionsEngine.onElementClick);
        object.lockMovementY = this.shouldLockDrag();
        object.lockMovementX = this.shouldLockDrag();
    };

    setScaling() {
        this.canvas.setZoom(this.scale);
        this.canvas.setWidth(this.width * this.canvas.getZoom());
        this.canvas.setHeight(this.height * this.canvas.getZoom());
    }

    setFloorName(newName: string) {
        this.name = newName;
    }

    renderData(jsonData?: FloorDoc["json"]) {
        this.setScaling();
        if (!jsonData) return this.renderEmptyFloor();

        this.canvas.loadFromJSON(
            jsonData,
            () => {
                if (this.mode === FloorMode.EDITOR) {
                    this.drawGrid();
                }
                this.canvas.renderAll();
            },
            this.elementReviver
        );
    }

    renderEmptyFloor() {
        if (this.mode === FloorMode.EDITOR) {
            this.canvas.renderAll();
            this.drawGrid();
        }
    }

    addTableElement(options: CreateTableOptions) {
        const group = match(options.tag)
            .with(ElementTag.RECT, () => this.addRectTableElement(options))
            .with(ElementTag.CIRCLE, () => this.addRoundTableElement(options))
            .exhaustive();

        group.on("mouseup", this.interactionsEngine.onElementClick);
        this.canvas.add(group);
    }

    private addRoundTableElement({ label, x, y }: CreateTableOptions) {
        const table = new RoundTable({
            label,
            radius: 50,
            originX: "center",
            originY: "center",
            lockMovementX: this.shouldLockDrag(),
            lockMovementY: this.shouldLockDrag(),
        });
        const text = new fabric.Text(label, {
            originX: "center",
            originY: "center",
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
        });
        return createGroup([table, text], { left: x, top: y });
    }

    private addRectTableElement({ label, x, y }: CreateTableOptions) {
        const table = new RectTable({
            label,
            width: TABLE_WIDTH,
            height: TABLE_HEIGHT,
            lockMovementX: this.shouldLockDrag(),
            lockMovementY: this.shouldLockDrag(),
        });
        const text = new fabric.Text(label, {
            originX: "center",
            originY: "center",
            left: 0.5 * 50,
            top: 0.5 * 50,
            fontSize: FONT_SIZE,
            fill: TABLE_TEXT_FILL_COLOR,
        });
        return createGroup([table, text], { left: x, top: y });
    }

    drawGrid() {
        const gridSize = RESOLUTION;
        const width = this.floorDoc.width;
        const height = this.floorDoc.height;
        const left = (width % gridSize) / 2;
        const top = (height % gridSize) / 2;
        const lines = [];
        const lineOption = { stroke: "rgba(0,0,0,1)", strokeWidth: 1, selectable: false };
        for (const i of range(0, Math.ceil(width / gridSize))) {
            lines.push(new fabric.Line([gridSize * i, -top, gridSize * i, height], lineOption));
        }
        for (const i of range(0, Math.ceil(height / gridSize))) {
            lines.push(new fabric.Line([-left, gridSize * i, width, gridSize * i], lineOption));
        }
        const oGridGroup = createGroup(lines, {
            left: 0,
            top: 0,
            selectable: false,
            excludeFromExport: true,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendToBack(oGridGroup);
    }

    setReservationOnTable(element: BaseTable, reservation: Reservation | null) {
        // @ts-ignore -- FIXME: figure out why it complains about set
        element.set({ reservation });
    }

    shouldLockDrag() {
        return this.mode !== FloorMode.EDITOR;
    }

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.renderData(this.floorDoc.json);
    }
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
