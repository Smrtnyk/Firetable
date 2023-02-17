import { fabric } from "fabric";
import { TableElement } from "./TableElement.js";
import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants.js";
import {
    BaseTable,
    CreateTableOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode,
    NumberTuple,
} from "./types.js";
import { RoundTableElement } from "./RoundTableElement.js";
import { ElementTag, FloorDoc, Reservation } from "@firetable/types";
import { match } from "ts-pattern";
import { isTable } from "./type-guards";
import { isDefined } from "@firetable/utils";

interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorDoc;
    mode: FloorMode;
    dblClickHandler?: FloorDoubleClickHandler;
    elementClickHandler: ElementClickHandler;
    containerWidth: number;
}

Object.assign(fabric, {
    TableElement,
    RoundTableElement,
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
    dblClickHandler?: FloorDoubleClickHandler;
    elementClickHandler: ElementClickHandler;

    onDblClickHandler = (ev: fabric.IEvent<MouseEvent>) => {
        if (containsTables(ev)) return;
        const coords: NumberTuple = [ev.pointer?.x || 50, ev.pointer?.y || 50];
        if (this.dblClickHandler) {
            this.dblClickHandler(this, coords);
        }
    };
    onMouseUpHandler = (ev: fabric.IEvent<MouseEvent>) => {
        if (containsTables(ev)) return;
        this.elementClickHandler(this, null);
    };
    onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        const table = getTableFromGroupElement(ev);
        if (table) {
            this.elementClickHandler(this, table);
        }
    };
    elementReviver = (o: string, object: fabric.Object) => {
        // @ts-ignore - complains about types but this works
        object.on("mouseup", this.onElementClick);
        object.lockMovementY = this.shouldLockDrag();
        object.lockMovementX = this.shouldLockDrag();
    };
    onObjectMove = (options: fabric.IEvent) => {
        if (!options.target?.left || !options.target?.top) return;
        if (
            Math.round((options.target.left / RESOLUTION) * 4) % 4 == 0 &&
            Math.round((options.target.top / RESOLUTION) * 4) % 4 == 0
        ) {
            options.target
                .set({
                    left: Math.round(options.target.left / RESOLUTION) * RESOLUTION,
                    top: Math.round(options.target.top / RESOLUTION) * RESOLUTION,
                })
                .setCoords();
        }
    };

    constructor({
        canvas,
        floorDoc,
        dblClickHandler,
        elementClickHandler,
        mode,
        containerWidth,
    }: FloorCreationOptions) {
        this.scale = calculateCanvasScale(containerWidth, floorDoc.width);
        const canvasOptions = {
            width: floorDoc.width,
            height: floorDoc.height,
            backgroundColor: "#333",
        };
        if (mode !== FloorMode.EDITOR) {
            Object.assign(canvasOptions, {
                interactive: false,
            });
        }

        this.width = floorDoc.width;
        this.height = floorDoc.height;
        this.containerWidth = containerWidth;
        this.floorDoc = floorDoc;
        this.canvas = new fabric.Canvas(canvas, canvasOptions);
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.mode = mode;
        if (dblClickHandler) {
            this.dblClickHandler = dblClickHandler;
        }
        this.elementClickHandler = elementClickHandler;
        this.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.canvas.on("mouse:up", this.onMouseUpHandler);
        this.canvas.on("object:moving", this.onObjectMove);
        this.canvas.on("object:scaling", (e) => {
            const { target } = e;
            if (!target) return;
            this.elementClickHandler(this, getTableFromGroupElement(e));
        });
        this.renderData(floorDoc.json);
    }

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
        if (jsonData) {
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
        } else {
            if (this.mode === FloorMode.EDITOR) {
                this.canvas.renderAll();
                this.drawGrid();
            }
        }
    }

    addTableElement(options: CreateTableOptions) {
        const { tag } = options;
        const group = match(tag)
            .with(ElementTag.RECT, () => this.addRectTableElement(options))
            .with(ElementTag.CIRCLE, () => this.addRoundTableElement(options))
            .exhaustive();

        group.on("mouseup", this.onElementClick);
        this.canvas.add(group);
    }

    private addRoundTableElement({ label, x, y }: CreateTableOptions) {
        const table = new RoundTableElement({
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
            fontSize: 20,
            fontFamily: "Helvetica",
            fill: "#fff",
        });
        return this.createGroup([table, text], x, y);
    }

    private addRectTableElement({ label, x, y }: CreateTableOptions) {
        const rect = new TableElement({
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
            fontSize: 20,
            fontFamily: "Helvetica",
            fill: "#fff",
        });
        return this.createGroup([rect, text], x, y);
    }

    createGroup(args: fabric.Object[], x: number, y: number): fabric.Group {
        return new fabric.Group(args, { left: x, top: y });
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
        const oGridGroup = new fabric.Group(lines, {
            left: 0,
            top: 0,
            selectable: false,
            excludeFromExport: true,
        });
        this.canvas.add(oGridGroup);
        this.canvas.sendToBack(oGridGroup);
    }

    setReservationOnTable(element: BaseTable, reservation: Reservation | null) {
        // @ts-ignore
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

function getTableFromGroupElement(ev: fabric.IEvent): BaseTable | null {
    const group = ev.target;
    // @ts-ignore -- not typed apparently
    return group?._objects.find(isTable);
}

function containsTables(ev: fabric.IEvent): boolean {
    return isDefined(getTableFromGroupElement(ev));
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
