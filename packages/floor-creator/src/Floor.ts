import { fabric } from "fabric";
import { CANVAS_BG_COLOR, DEFAULT_COORDINATE, RESOLUTION } from "./constants.js";
import {
    BaseTable,
    CreateElementOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorMode,
    NumberTuple,
} from "./types.js";
import { FloorDoc, Reservation } from "@firetable/types";
import { isFloorElement, isTable } from "./type-guards";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { ElementManager } from "./ElementManager";
import { TouchManager } from "./TouchManager";
import { GridDrawer } from "./GridDrawer";
import { FloorZoomManager } from "./FloorZoomManager";

interface FloorCreationOptions {
    canvas: HTMLCanvasElement;
    floorDoc: FloorDoc;
    mode: FloorMode;
    dblClickHandler?: FloorDoubleClickHandler;
    elementClickHandler: ElementClickHandler;
    containerWidth: number;
}

Object.assign(fabric, { RectTable, RoundTable });

export class Floor {
    readonly id: string;
    name: string;
    readonly scale: number;
    height: number;
    readonly containerWidth: number;
    readonly floorDoc: FloorDoc;
    readonly canvas: fabric.Canvas;
    readonly dblClickHandler?: FloorDoubleClickHandler;
    readonly elementClickHandler: ElementClickHandler;
    currentZoomSteps = 0;
    mode: FloorMode;
    width: number;
    readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    elementManager: ElementManager;
    private touchManager: TouchManager;
    private gridDrawer: GridDrawer;
    zoomManager: FloorZoomManager;

    constructor(options: FloorCreationOptions) {
        const { canvas, floorDoc, dblClickHandler, elementClickHandler, mode, containerWidth } =
            options;

        this.scale = calculateCanvasScale(containerWidth, floorDoc.width);
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.width = floorDoc.width;
        this.height = floorDoc.height;
        this.containerWidth = containerWidth;
        this.floorDoc = floorDoc;
        this.mode = mode;
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;

        this.canvas = new fabric.Canvas(canvas, {
            width: this.width,
            height: this.height,
            backgroundColor: CANVAS_BG_COLOR,
            interactive: this.isInEditorMode,
            selection: false,
            // @ts-ignore
            enablePointerEvents: true,
        });
        this.elementManager = new ElementManager({
            isInEditorMode: mode === FloorMode.EDITOR,
        });
        this.gridDrawer = new GridDrawer(this.canvas);
        this.renderData(this.floorDoc.json);
        this.canvas.renderAll();
        this.initialScale = this.canvas.getZoom();
        this.initialViewportTransform = this.canvas.viewportTransform?.slice() || [];

        this.zoomManager = new FloorZoomManager(
            this.canvas,
            this.initialScale,
            this.initialViewportTransform,
        );

        this.touchManager = new TouchManager(this.canvas, this);
        this.initializeCanvasEventHandlers();
    }

    get json() {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    addElement(options: CreateElementOptions) {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", this.onElementClick);
        this.canvas.add(element);
    }

    zoomIn(point: fabric.Point) {
        this.zoomManager.zoomIn(point);
    }

    zoomOut(point: fabric.Point) {
        this.zoomManager.zoomOut(point);
    }

    private get isInEditorMode(): boolean {
        return this.mode === FloorMode.EDITOR;
    }

    private initializeCanvasEventHandlers() {
        this.canvas.on("mouse:dblclick", this.onDblClickHandler);
        this.canvas.on("object:moving", this.onObjectMove);
        this.canvas.on("mouse:wheel", this.onMouseWheelHandler);
        this.canvas.on("object:scaling", (e) => {
            if (!isTable(e.target)) return;
            this.elementClickHandler(this, e.target);
        });

        // @ts-ignore -- private prop
        const upperCanvasEl = this.canvas.upperCanvasEl;
        upperCanvasEl.addEventListener("touchstart", this.touchManager.onTouchStart, {
            passive: true,
        });
        upperCanvasEl.addEventListener("touchmove", this.touchManager.onTouchMove, {
            passive: true,
        });
        upperCanvasEl.addEventListener("touchend", this.touchManager.onTouchEnd, { passive: true });
    }

    private onMouseWheelHandler = (opt: fabric.IEvent<WheelEvent>) => {
        if (!opt.e) {
            return;
        }

        const delta = opt.e.deltaY;

        if (delta > 0 && this.zoomManager.canZoomIn()) {
            this.zoomManager.zoomIn(new fabric.Point(opt.e.offsetX, opt.e.offsetY));
        } else if (delta < 0 && this.zoomManager.canZoomOut()) {
            this.zoomManager.zoomOut(new fabric.Point(opt.e.offsetX, opt.e.offsetY));
            if (!this.zoomManager.canZoomOut()) {
                this.zoomManager.resetZoom();
            }
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };

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
                    this.gridDrawer.drawGrid(this.width, this.height);
                }
                this.canvas.renderAll();
            },
            this.elementReviver,
        );
    }

    renderEmptyFloor() {
        if (this.mode === FloorMode.EDITOR) {
            this.canvas.renderAll();
            this.gridDrawer.drawGrid(this.width, this.height);
        }
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
