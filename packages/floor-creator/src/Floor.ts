import { fabric } from "fabric";
import { TableElement } from "./TableElement";
import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import {
    BaseTable,
    CreateTableOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode, NumberTuple
} from "./types";
import { RoundTableElement } from "./RoundTableElement";
import { ElementTag, FloorDoc, Reservation } from "@firetable/types";

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

    renderData(jsonData?: string) {
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
        let group;
        if (tag === ElementTag.RECT) {
            group = this.addRectTableElement(options);
        } else {
            group = this.addRoundTableElement(options);
        }

        // @ts-ignore - Types suggest that it is mouse:up, but it is mouseup
        group.on("mouseup", this.onElementClick);
        this.canvas.add(group);
    }

    addRoundTableElement({ label, x, y }: CreateTableOptions) {
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
        return new fabric.Group([table, text], {
            left: x,
            top: y,
        });
    }

    addRectTableElement({ label, x, y }: CreateTableOptions) {
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
        return new fabric.Group([rect, text], {
            left: x,
            top: y,
        });
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
    // @ts-ignore
    const table = group?._objects[0];
    if (table instanceof TableElement || table instanceof RoundTableElement) {
        return table;
    }
    return null;
}

function containsTables(ev: fabric.IEvent): boolean {
    return !!getTableFromGroupElement(ev);
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
