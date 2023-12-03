import type { FabricObject } from "fabric";
import { Canvas, classRegistry } from "fabric";
import { CANVAS_BG_COLOR } from "./constants.js";
import type { BaseTable, FloorCreationOptions } from "./types.js";
import { FloorElementTypes } from "./types.js";
import type { FloorDoc } from "@firetable/types";
import { TouchManager } from "./TouchManager";
import { FloorZoomManager } from "./FloorZoomManager";
import type { EventManager } from "./event-manager/EventManager";
import { calculateCanvasScale } from "./utils";
import type { EventEmitterListener } from "./event-emitter/EventEmitter";
import { isTable } from "./type-guards";
import { getTables } from "./filters";
import { RectTable } from "./elements/RectTable";
import { Sofa } from "./elements/Sofa";
import { Wall } from "./elements/Wall";
import { RoundTable } from "./elements/RoundTable";

classRegistry.setClass(RectTable, FloorElementTypes.RECT_TABLE);
classRegistry.setClass(RoundTable, FloorElementTypes.ROUND_TABLE);
classRegistry.setClass(Sofa, FloorElementTypes.SOFA);
classRegistry.setClass(Wall, FloorElementTypes.WALL);

export abstract class Floor {
    readonly id: string;
    name: string;
    scale: number;
    height: number;
    readonly floorDoc: FloorDoc;
    readonly canvas: Canvas;
    width: number;
    containerWidth: number;
    touchManager: TouchManager;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

    abstract onFloorDoubleTap(coordinates: [x: number, y: number]): void;
    abstract emit(event: string, ...args: unknown[]): void;
    abstract on(event: string, listener: EventEmitterListener): void;
    protected abstract onElementClick(ev: FabricObject): void;
    protected abstract setElementProperties(element: FabricObject): void;
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

        this.canvas = new Canvas(canvas, {
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

    get json(): string {
        const json = this.canvas.toDatalessJSON(["label", "name", "type"]);
        return JSON.stringify(json);
    }

    elementReviver = (_: Record<string, any>, object: FabricObject): void => {
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
        if (!jsonData) {
            return;
        }
        this.canvas
            // @ts-expect-error -- ok
            .loadFromJSON(jsonData, this.elementReviver)
            .then(() => {
                this.emit("rendered");
                return this.canvas.requestRenderAll();
            })
            .catch(console.error);
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
        getTables(this).forEach((table) => {
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
