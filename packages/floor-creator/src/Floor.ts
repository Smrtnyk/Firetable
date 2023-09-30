import { fabric } from "fabric";
import { CANVAS_BG_COLOR, RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants.js";
import {
    BaseTable,
    CreateElementOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode,
    NumberTuple,
} from "./types.js";
import { ElementTag, FloorDoc, Reservation } from "@firetable/types";
import { match } from "ts-pattern";
import { isFloorElement, isTable } from "./type-guards";
import { createGroup } from "./factories";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { Sofa } from "./elements/Sofa";
import { DJBooth } from "./elements/DJBooth";

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

const DEFAULT_ZOOM = 1;
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM_STEPS = 5;
const DEFAULT_COORDINATE = 50;

export class Floor {
    id: string;
    name: string;
    scale: number;
    width: number;
    height: number;
    mode: FloorMode;
    floorDoc: FloorDoc;
    containerWidth: number;
    canvas: fabric.Canvas;
    dblClickHandler: FloorDoubleClickHandler | undefined;
    private currentZoomSteps: number;
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
            selection: false,
        });

        this.currentZoomSteps = 0; // Counter to keep track of current zoom steps
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.mode = mode;
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;
        this.initializeCanvasEventHandlers();
        this.renderData(floorDoc.json);
    }

    private initializeCanvasEventHandlers() {
        this.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.canvas.on("object:moving", this.onObjectMove);
        this.canvas.on("mouse:wheel", this.onMouseWheelHandler);
        this.canvas.on("object:scaling", (e) => {
            if (!isTable(e.target)) return;
            this.elementClickHandler(this, e.target);
        });

        this.initializePanning();
    }

    // Renamed for clarity
    private onMouseWheelHandler = (opt: fabric.IEvent<WheelEvent>) => {
        // Added validation to ensure opt.e is defined
        if (!opt.e) {
            console.error("Mouse event is undefined");
            return;
        }

        // Using constants instead of magic numbers
        const delta = opt.e.deltaY;
        if (delta > 0 && this.currentZoomSteps < MAX_ZOOM_STEPS) {
            this.currentZoomSteps++;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
        } else if (delta < 0 && this.currentZoomSteps > 0) {
            this.currentZoomSteps--;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();

        if (this.canvas.getZoom() <= this.scale) {
            this.resetZoomPan();
        }
    };

    // Factored out zooming operation into its own method for clarity
    private performZoom(offsetX: number, offsetY: number) {
        this.canvas.zoomToPoint(
            new fabric.Point(offsetX, offsetY),
            DEFAULT_ZOOM + this.currentZoomSteps * ZOOM_INCREMENT,
        );
    }

    private initializePanning(): void {
        let panning = false;

        this.canvas.on("mouse:down", (opt) => {
            if (opt.e.altKey) {
                panning = true;
                this.canvas.setCursor("grab");
            }
        });

        this.canvas.on("mouse:up", () => {
            panning = false;
            this.canvas.setCursor("default");
        });

        this.canvas.on("mouse:move", (opt) => {
            if (panning && opt.e) {
                if (this.canvas.viewportTransform) {
                    const transform = this.canvas.viewportTransform.slice(0);
                    transform[4] += opt.e.movementX;
                    transform[5] += opt.e.movementY;
                    this.canvas.setViewportTransform(transform);
                }
            }
        });
    }

    resetZoomPan() {
        const width = this.canvas.getWidth();
        const height = this.canvas.getHeight();

        // Reset the zoom level to the initial scale
        this.canvas.setZoom(this.scale);

        // Set the top-left corner of the viewport to be in the top-left corner of the canvas,
        // adjusted by the scale factor to center the canvas content
        this.canvas.viewportTransform = [
            this.scale,
            0,
            0,
            this.scale,
            (width - this.width * this.scale) / 2,
            (height - this.height * this.scale) / 2,
        ];

        // Redraw the canvas to reflect the changes
        this.canvas.requestRenderAll();
    }

    // Check if double click was on the actual table
    // if it is, then do nothing, but if it is not
    // then invoke the handler
    private onDblClickHandler = (ev: fabric.IEvent) => {
        if (isFloorElement(ev.target)) return;
        const coords: NumberTuple = [
            ev.pointer?.x || DEFAULT_COORDINATE,
            ev.pointer?.y || DEFAULT_COORDINATE,
        ];
        this.dblClickHandler?.(this, coords);
    };

    onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        this.elementClickHandler(this, ev.target);
    };

    elementReviver = (_: string, object: fabric.Object) => {
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

    addTableElement(options: CreateElementOptions) {
        const group = match(options.tag)
            .with(ElementTag.RECT, () => this.addRectTableElement(options))
            .with(ElementTag.CIRCLE, () => this.addRoundTableElement(options))
            .with(ElementTag.SOFA, () => this.addSofaElement(options))
            .with(ElementTag.DJ_BOOTH, () => this.addDJBooth(options))
            .exhaustive();

        group.on("mouseup", this.onElementClick);
        this.canvas.add(group);
    }

    private addDJBooth({ x, y }: CreateElementOptions) {
        return new DJBooth(x, y);
    }

    private addSofaElement({ x, y }: CreateElementOptions) {
        return new Sofa(x, y);
    }

    private addRoundTableElement({ label, x, y }: CreateElementOptions) {
        if (!label) {
            throw new Error("Cannot create table without the label!");
        }
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

    private addRectTableElement({ label, x, y }: CreateElementOptions) {
        if (!label) {
            throw new Error("Cannot create table without the label!");
        }
        return new RectTable({
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
        element.reservation = reservation;
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
