import { fabric } from "fabric";
import { CANVAS_BG_COLOR } from "./constants.js";
import { BaseTable, FloorCreationOptions } from "./types.js";
import { FloorDoc } from "@firetable/types";
import { RoundTable } from "./elements/RoundTable";
import { RectTable } from "./elements/RectTable";
import { TouchManager } from "./TouchManager";
import { FloorZoomManager } from "./FloorZoomManager";
import { EventManager } from "./event-manager/EventManager";
import { calculateCanvasScale } from "./utils";
import { EventEmitterListener } from "./event-emitter/EventEmitter";
import { isTable } from "./type-guards";
import { getReservedTables } from "./filters";

Object.assign(fabric, { RectTable, RoundTable });

export abstract class Floor {
    readonly id: string;
    name: string;
    scale: number;
    height: number;
    readonly floorDoc: FloorDoc;
    readonly canvas: fabric.Canvas;
    width: number;
    containerWidth: number;
    touchManager: TouchManager;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

    abstract onFloorDoubleTap(coordinates: [x: number, y: number]): void;
    abstract emit(event: string, ...args: unknown[]): void;
    abstract on(event: string, listener: EventEmitterListener): void;
    protected abstract onElementClick(ev: fabric.Object): void;
    protected abstract setElementProperties(element: fabric.Object): void;
    abstract destroy(): void;

    protected constructor(options: FloorCreationOptions) {
        const { canvas, floorDoc, containerWidth } = options;

        this.scale = calculateCanvasScale(containerWidth, floorDoc.width);
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.width = floorDoc.width;
        this.containerWidth = containerWidth;
        this.height = floorDoc.height;
        this.floorDoc = floorDoc;

        this.canvas = new fabric.Canvas(canvas, {
            width: this.width,
            height: this.height,
            backgroundColor: CANVAS_BG_COLOR,
            selection: false,
            skipOffscreen: true,
            imageSmoothingEnabled: false,
        });
        this.setScaling();
        this.renderData(this.floorDoc.json);

        this.zoomManager = new FloorZoomManager(this, this.canvas, this.canvas.getZoom());

        this.touchManager = new TouchManager(this);
    }

    get json(): ReturnType<typeof fabric.Canvas.toJSON> {
        return this.canvas.toJSON(["label", "reservation", "name", "type"]);
    }

    elementReviver = (_: string, object: fabric.Object): void => {
        object.on("mouseup", () => {
            this.onElementClick(object);
        });
        this.setElementProperties(object);
    };

    setObjectCoords(): void {
        this.canvas.forEachObject((object) => {
            object.setCoords();
        });
    }

    setScaling(): void {
        this.canvas.setZoom(this.scale);
        this.canvas.setWidth(this.width * this.canvas.getZoom());
        this.canvas.setHeight(this.height * this.canvas.getZoom());
        this.setObjectCoords();
    }

    renderData(jsonData?: FloorDoc["json"]): void {
        this.canvas.loadFromJSON(
            jsonData,
            () => {
                this.canvas.requestRenderAll();
            },
            this.elementReviver,
        );
    }

    getTableByLabel(tableLabel: string): BaseTable | undefined {
        return this.canvas._objects.find((object): object is BaseTable => {
            if (!isTable(object)) {
                return false;
            }
            return object.label === tableLabel;
        });
    }

    clearAllReservations(): void {
        getReservedTables(this).forEach((table) => {
            table.setReservation(void 0);
        });
        this.canvas.requestRenderAll();
    }

    resize(pageContainerWidth: number): void {
        this.containerWidth = pageContainerWidth;
        this.scale = calculateCanvasScale(this.containerWidth, this.floorDoc.width);
        this.setScaling();
        this.zoomManager.setScale(this.scale);
    }
}
