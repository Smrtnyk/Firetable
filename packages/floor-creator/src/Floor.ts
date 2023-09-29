import { fabric } from "fabric";
import { CANVAS_BG_COLOR, RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants.js";
import {
    BaseTable,
    CreateTableOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode,
    NumberTuple,
} from "./types.js";
import { ElementTag, FloorDoc, Reservation } from "@firetable/types";
import { match } from "ts-pattern";
import { isTable } from "./type-guards";
import { createGroup } from "./factories";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { Sofa } from "./elements/Sofa";

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
    dblClickHandler: FloorDoubleClickHandler | undefined;
    elementClickHandler: ElementClickHandler;

    constructor({
        canvas,
        floorDoc,
        dblClickHandler,
        elementClickHandler,
        mode,
        containerWidth,
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
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;
        this.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.canvas.on("mouse:up", this.onMouseUpHandler);
        this.canvas.on("object:moving", this.onObjectMove);
        this.canvas.on("object:scaling", (e) => {
            if (!isTable(e.target)) return;
            this.elementClickHandler(this, e.target);
        });
        this.renderData(floorDoc.json);
    }

    // Check if double click was on the actual table
    // if it is, then do nothing, but if it is not
    // then invoke the handler
    onDblClickHandler = (ev: fabric.IEvent<MouseEvent>) => {
        if (isTable(ev.target)) return;
        const coords: NumberTuple = [ev.pointer?.x || 50, ev.pointer?.y || 50];
        this.dblClickHandler?.(this, coords);
    };

    onMouseUpHandler = (ev: fabric.IEvent<MouseEvent>) => {
        if (isTable(ev.target)) return;
        this.elementClickHandler(this, null);
    };

    onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        if (isTable(ev.target)) {
            this.elementClickHandler(this, ev.target);
        }
    };

    elementReviver = (o: string, object: fabric.Object) => {
        object.on("mouseup", this.onElementClick);
        object.lockMovementY = this.shouldLockDrag();
        object.lockMovementX = this.shouldLockDrag();
    };

    onObjectMove = (options: fabric.IEvent) => {
        if (!options.target?.left || !options.target?.top) return;
        const shouldSnapToGrid =
            Math.round((options.target.left / RESOLUTION) * 4) % 4 === 0 &&
            Math.round((options.target.top / RESOLUTION) * 4) % 4 === 0;
        if (shouldSnapToGrid) {
            options.target
                .set({
                    left: Math.round(options.target.left / RESOLUTION) * RESOLUTION,
                    top: Math.round(options.target.top / RESOLUTION) * RESOLUTION,
                })
                .setCoords();
        }
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
            this.elementReviver,
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
            .with(ElementTag.SOFA, () => this.addSofaElement(options))
            .exhaustive();

        group.on("mouseup", this.onElementClick);
        this.canvas.add(group);
    }

    private addSofaElement({ x, y }: any) {
        return new Sofa(x, y);
    }

    private addRoundTableElement({ label, x, y }: CreateTableOptions) {
        const table = new RoundTable({
            groupOptions: {
                label,
                lockMovementX: this.shouldLockDrag(),
                lockMovementY: this.shouldLockDrag(),
            },
            circleOptions: {
                radius: 50,
            },
            textOptions: { label },
        });
        table.set({ left: x, top: y });
        return table;
    }

    private addRectTableElement({ label, x, y }: CreateTableOptions) {
        const table = new RectTable({
            groupOptions: {
                label,
                left: x,
                top: y,
                lockMovementX: this.shouldLockDrag(),
                lockMovementY: this.shouldLockDrag(),
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

    drawGrid() {
        const gridSize = RESOLUTION;
        const width = this.floorDoc.width;
        const height = this.floorDoc.height;
        const left = (width % gridSize) / 2;
        const top = (height % gridSize) / 2;
        const lines = [];
        const lineOption = { stroke: "rgba(0,0,0,1)", strokeWidth: 1, selectable: false };
        for (let i = Math.ceil(width / gridSize); i--; ) {
            lines.push(new fabric.Line([gridSize * i, -top, gridSize * i, height], lineOption));
        }
        for (let i = Math.ceil(height / gridSize); i--; ) {
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
