import { fabric } from "fabric";
import {
    CANVAS_BG_COLOR,
    DEFAULT_COORDINATE,
    DEFAULT_ZOOM,
    MAX_ZOOM_STEPS,
    RESOLUTION,
    ZOOM_INCREMENT,
} from "./constants.js";
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
    private currentZoomSteps = 0;
    mode: FloorMode;
    width: number;
    private readonly initialScale: number;
    private initialViewportTransform: number[];
    elementManager: ElementManager;

    private initialPinchDistance: number | null = null;
    private initialDragX: number | null = null;
    private initialDragY: number | null = null;

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
        this.initializeCanvasEventHandlers();
        this.renderData(this.floorDoc.json);
        this.canvas.renderAll();
        this.initialScale = this.canvas.getZoom();
        this.initialViewportTransform = this.canvas.viewportTransform?.slice() || [];
        // @ts-ignore -- private prop
        const upperCanvasEl = this.canvas.upperCanvasEl;
        upperCanvasEl.addEventListener("touchstart", this.onTouchStart, { passive: true });
        upperCanvasEl.addEventListener("touchmove", this.onTouchMove, { passive: true });
        upperCanvasEl.addEventListener("touchend", this.onTouchEnd, { passive: true });
    }

    private getDistance(touches: TouchList): number {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2),
        );
    }

    private onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            this.initialPinchDistance = this.getDistance(e.touches);
        } else if (e.touches.length === 1) {
            this.initialDragX = e.touches[0].clientX;
            this.initialDragY = e.touches[0].clientY;
        }
    };

    private onTouchMove = (e: TouchEvent) => {
        const activeObject = this.canvas.getActiveObject();

        // If an object is selected, don't pan the canvas
        if (activeObject) {
            return;
        }
        // Handle pinch to zoom
        if (e.touches.length === 2 && this.initialPinchDistance !== null) {
            const newDistance = this.getDistance(e.touches);
            const scale = newDistance / this.initialPinchDistance;

            const delta = scale > 1 ? 10 : -10; // Adjust these numbers to modify sensitivity

            this.handleZoomLogic({
                e: { deltaY: delta, offsetX: e.touches[0].clientX, offsetY: e.touches[0].clientY },
            } as fabric.IEvent<WheelEvent>);

            // Update the initial distance for the next move.
            this.initialPinchDistance = newDistance;
        }
        // Handle single touch move for panning
        else if (
            e.touches.length === 1 &&
            this.initialDragX != undefined &&
            this.initialDragY != undefined
        ) {
            if (this.canvas.getZoom() === this.initialScale) {
                return; // No panning if not zoomed in
            }

            const deltaX = e.touches[0].clientX - this.initialDragX;
            const deltaY = e.touches[0].clientY - this.initialDragY;

            const { newPosX, newPosY } = this.checkBoundaries(deltaX, deltaY);

            const viewportTransform = this.canvas.viewportTransform?.slice() || [1, 0, 0, 1, 0, 0];
            viewportTransform[4] = newPosX;
            viewportTransform[5] = newPosY;

            this.canvas.setViewportTransform(viewportTransform);
            this.canvas.requestRenderAll();

            this.initialDragX = e.touches[0].clientX;
            this.initialDragY = e.touches[0].clientY;
        }
    };

    private onTouchEnd = () => {
        this.initialPinchDistance = null;
    };

    checkBoundaries(deltaX: number, deltaY: number) {
        let newPosX =
            (this.canvas.viewportTransform ? this.canvas.viewportTransform[4] : 0) + deltaX;
        let newPosY =
            (this.canvas.viewportTransform ? this.canvas.viewportTransform[5] : 0) + deltaY;

        // Check boundaries for X
        if (newPosX > 0) {
            newPosX = 0;
        } else if (newPosX + this.width * this.canvas.getZoom() < this.canvas.getWidth()) {
            newPosX = this.canvas.getWidth() - this.width * this.canvas.getZoom();
        }

        // Check boundaries for Y
        if (newPosY > 0) {
            newPosY = 0;
        } else if (newPosY + this.height * this.canvas.getZoom() < this.canvas.getHeight()) {
            newPosY = this.canvas.getHeight() - this.height * this.canvas.getZoom();
        }

        return { newPosX, newPosY };
    }

    private handleZoomLogic = (opt: fabric.IEvent<WheelEvent>) => {
        if (!opt.e) {
            return;
        }

        const delta = opt.e.deltaY;
        let shouldReset = false;

        if (delta > 0 && this.currentZoomSteps < MAX_ZOOM_STEPS) {
            this.currentZoomSteps++;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
        } else if (delta < 0 && this.currentZoomSteps > 0) {
            this.currentZoomSteps--;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
            if (this.currentZoomSteps <= 0) {
                shouldReset = true;
            }
        }

        if (shouldReset) {
            this.resetToInitialState();
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };

    get json() {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    addElement(options: CreateElementOptions) {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", this.onElementClick);
        this.canvas.add(element);
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
    }

    private onMouseWheelHandler = (opt: fabric.IEvent<WheelEvent>) => {
        if (!opt.e) {
            return;
        }

        const delta = opt.e.deltaY;
        let shouldReset = false;

        if (delta > 0 && this.currentZoomSteps < MAX_ZOOM_STEPS) {
            this.currentZoomSteps++;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
        } else if (delta < 0 && this.currentZoomSteps > 0) {
            this.currentZoomSteps--;
            this.performZoom(opt.e.offsetX, opt.e.offsetY);
            if (this.currentZoomSteps <= 0) {
                shouldReset = true;
            }
        }

        if (shouldReset) {
            this.resetToInitialState();
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
    };

    private performZoom(offsetX: number, offsetY: number) {
        const newZoom = DEFAULT_ZOOM + this.currentZoomSteps * ZOOM_INCREMENT;

        // Prevent over-zooming out
        if (newZoom < this.initialScale) {
            this.resetToInitialState();
            return;
        }

        this.canvas.zoomToPoint(new fabric.Point(offsetX, offsetY), newZoom);
        this.canvas.renderAll();
    }

    private resetToInitialState() {
        this.canvas.setViewportTransform(this.initialViewportTransform.slice());
        this.canvas.setZoom(this.initialScale);
        this.canvas.renderAll();
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

    drawGrid() {
        const gridSize = RESOLUTION;
        const width = this.floorDoc.width;
        const height = this.floorDoc.height;
        const left = (width % gridSize) / 2;
        const top = (height % gridSize) / 2;

        const lines = this.createGridLines(width, height, gridSize, left, top);
        this.addGridToCanvas(lines);
    }

    private createGridLines(
        width: number,
        height: number,
        gridSize: number,
        left: number,
        top: number,
    ): fabric.Line[] {
        const lineOption = { stroke: "rgba(0,0,0,1)", strokeWidth: 1, selectable: false };
        const lines = [];

        for (let i = Math.ceil(width / gridSize); i--; ) {
            lines.push(new fabric.Line([gridSize * i, -top, gridSize * i, height], lineOption));
        }
        for (let i = Math.ceil(height / gridSize); i--; ) {
            lines.push(new fabric.Line([-left, gridSize * i, width, gridSize * i], lineOption));
        }

        return lines;
    }

    private addGridToCanvas(lines: fabric.Line[]): void {
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
