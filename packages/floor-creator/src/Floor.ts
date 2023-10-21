import { fabric } from "fabric";
import { CANVAS_BG_COLOR } from "./constants.js";
import {
    BaseTable,
    CreateElementOptions,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FloorEditorElement,
    FloorMode,
} from "./types.js";
import { FloorDoc, Reservation } from "@firetable/types";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { ElementManager } from "./ElementManager";
import { TouchManager } from "./TouchManager";
import { GridDrawer } from "./GridDrawer";
import { FloorZoomManager } from "./FloorZoomManager";
import { EventManager } from "./EventManager.js";

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
    mode: FloorMode;
    width: number;
    readonly initialScale: number;
    private readonly initialViewportTransform: number[];
    elementManager: ElementManager;
    touchManager: TouchManager;
    private gridDrawer: GridDrawer;
    zoomManager: FloorZoomManager;
    eventManager: EventManager;

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

        this.touchManager = new TouchManager(this);

        this.eventManager = new EventManager(this);
        this.eventManager.initializeCanvasEventHandlers();
    }

    get json() {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    addElement(options: CreateElementOptions) {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", this.onElementClick);
        this.setElementPropertiesBasedOnMode(element);
        this.canvas.add(element);
    }

    private setElementPropertiesBasedOnMode(element: fabric.Object) {
        if (this.isInEditorMode) {
            element.lockScalingX = false;
            element.lockScalingY = false;
            element.lockMovementX = false;
            element.lockMovementY = false;
        } else {
            element.lockScalingX = true;
            element.lockScalingY = true;
            element.lockMovementX = true;
            element.lockMovementY = true;
        }

        element.lockScalingFlip = true;
    }

    private get isInEditorMode(): boolean {
        return this.mode === FloorMode.EDITOR;
    }

    toggleGridVisibility = () => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        this.elementClickHandler(this, ev.target as FloorEditorElement);
    };

    elementReviver = (_: string, object: fabric.Object) => {
        object.on("mouseup", this.onElementClick);
        this.setElementPropertiesBasedOnMode(object);
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

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.renderData(this.floorDoc.json);
    }
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
