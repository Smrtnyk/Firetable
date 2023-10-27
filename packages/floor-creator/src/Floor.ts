import { fabric } from "fabric";
import { CANVAS_BG_COLOR } from "./constants.js";
import {
    BaseTable,
    ElementClickHandler,
    FloorCreationOptions,
    FloorDoubleClickHandler,
    FloorMode,
    TableToTableHandler,
} from "./types.js";
import { FloorDoc, Reservation } from "@firetable/types";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { TouchManager } from "./TouchManager";
import { FloorZoomManager } from "./FloorZoomManager";
import { EventManager } from "./event-manager/EventManager";

Object.assign(fabric, { RectTable, RoundTable });

export abstract class Floor {
    readonly id: string;
    name: string;
    readonly scale: number;
    height: number;
    readonly floorDoc: FloorDoc;
    readonly canvas: fabric.Canvas;
    readonly dblClickHandler?: FloorDoubleClickHandler;
    readonly elementClickHandler: ElementClickHandler;
    readonly tableToTableHandler?: TableToTableHandler;
    width: number;
    touchManager: TouchManager;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

    protected abstract initializeCanvasEventHandlers(): void;
    protected abstract onElementClick(ev: fabric.IEvent<MouseEvent>): void;
    protected abstract setElementProperties(element: fabric.Object): void;

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
        this.floorDoc = floorDoc;
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;
        this.tableToTableHandler = tableToTableHandler;

        this.canvas = new fabric.Canvas(canvas, {
            width: this.width,
            height: this.height,
            backgroundColor: CANVAS_BG_COLOR,
            interactive: mode === FloorMode.EDITOR,
            selection: false,
        });
        this.renderData(this.floorDoc.json);
        this.canvas.renderAll();

        this.zoomManager = new FloorZoomManager(
            this.canvas,
            this.canvas.getZoom(),
            this.canvas.viewportTransform?.slice() || [],
        );

        this.touchManager = new TouchManager(this);
    }

    get json() {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    elementReviver = (_: string, object: fabric.Object) => {
        object.on("mouseup", (ev) => {
            this.onElementClick(ev);
        });
        this.setElementProperties(object);
    };

    setScaling() {
        this.canvas.setZoom(this.scale);
        this.canvas.setWidth(this.width * this.canvas.getZoom());
        this.canvas.setHeight(this.height * this.canvas.getZoom());
    }

    renderData(jsonData?: FloorDoc["json"]) {
        this.setScaling();
        this.canvas.loadFromJSON(
            jsonData,
            () => {
                this.canvas.renderAll();
            },
            this.elementReviver,
        );
    }

    setReservationOnTable(element: BaseTable, reservation: Reservation | null) {
        element.reservation = reservation;
    }
}

function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
