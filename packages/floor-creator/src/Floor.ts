import { fabric } from "fabric";
import { CANVAS_BG_COLOR } from "./constants.js";
import {
    BaseTable,
    ElementClickHandler,
    FloorCreationOptions,
    FloorDoubleClickHandler,
    FloorEditorElement,
    FloorMode,
    TableToTableHandler,
} from "./types.js";
import { FloorDoc, Reservation } from "@firetable/types";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { TouchManager } from "./TouchManager";
import { GridDrawer } from "./GridDrawer";
import { FloorZoomManager } from "./FloorZoomManager";
import { EventManager } from "./EventManager.js";

Object.assign(fabric, { RectTable, RoundTable });

export abstract class Floor {
    readonly id: string;
    name: string;
    readonly scale: number;
    height: number;
    readonly containerWidth: number;
    readonly floorDoc: FloorDoc;
    readonly canvas: fabric.Canvas;
    readonly dblClickHandler?: FloorDoubleClickHandler;
    readonly elementClickHandler: ElementClickHandler;
    readonly tableToTableHandler?: TableToTableHandler;
    mode: FloorMode;
    width: number;
    readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    touchManager: TouchManager;
    protected gridDrawer: GridDrawer;
    zoomManager: FloorZoomManager;
    protected abstract eventManager: EventManager;

    abstract initializeCanvasEventHandlers(): void;

    constructor(options: FloorCreationOptions) {
        const {
            canvas,
            floorDoc,
            dblClickHandler,
            elementClickHandler,
            mode,
            containerWidth,
            tableToTableHandler,
        } = options;

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
        this.tableToTableHandler = tableToTableHandler;

        this.canvas = new fabric.Canvas(canvas, {
            width: this.width,
            height: this.height,
            backgroundColor: CANVAS_BG_COLOR,
            interactive: this.isInEditorMode,
            selection: false,
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

        this.touchManager = new TouchManager(this);
    }

    get json() {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    protected abstract setElementProperties(element: fabric.Object): void;

    get isInEditorMode(): boolean {
        return this.mode === FloorMode.EDITOR;
    }

    onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        // Check if there was a move operation. If there was, just return.
        if (this.eventManager.hasMouseMoved) return;

        this.elementClickHandler(this, ev.target as FloorEditorElement);
    };

    elementReviver = (_: string, object: fabric.Object) => {
        object.on("mouseup", this.onElementClick);
        this.setElementProperties(object);
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

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.renderData(this.floorDoc.json);
    }
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
