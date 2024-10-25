import type { FabricObject } from "fabric";
import type { BaseTable, FloorCreationOptions, FloorData } from "./types.js";
import type { EventManager } from "./event-manager/EventManager.js";
import { CANVAS_BG_COLOR } from "./constants.js";
import { TouchManager } from "./TouchManager.js";
import { FloorZoomManager } from "./FloorZoomManager.js";
import { calculateCanvasScale } from "./utils.js";
import { isTable } from "./type-guards.js";
import { getTables } from "./filters.js";
import { RectTable } from "./elements/RectTable.js";
import { Wall } from "./elements/Wall.js";
import { RoundTable } from "./elements/RoundTable.js";
import { EditableShape } from "./elements/EditableShape.js";
import { Canvas, classRegistry } from "fabric";

classRegistry.setClass(RectTable);
classRegistry.setClass(RoundTable);
classRegistry.setClass(Wall);
classRegistry.setClass(EditableShape);

export abstract class Floor {
    readonly id: string;
    name: string;
    scale: number;
    height: number;
    readonly floorDoc: FloorData;
    readonly canvas: Canvas;
    width: number;
    containerWidth: number;
    touchManager: TouchManager;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

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

    elementReviver = (_: Record<string, unknown>, object: FabricObject): void => {
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

    renderData(jsonData?: FloorData["json"]): Promise<void> {
        if (!jsonData) {
            return Promise.resolve();
        }
        return (
            this.canvas
                // @ts-expect-error -- figure this out, our type might not be accurate
                .loadFromJSON(jsonData, this.elementReviver)
                .then(() => {
                    this.emit("rendered");
                    return this.canvas.requestRenderAll();
                })
        );
    }

    getTableByLabel(tableLabel: string): BaseTable | undefined {
        return this.canvas._objects.find(function (object): object is BaseTable {
            if (!isTable(object)) {
                return false;
            }
            return object.label === tableLabel;
        });
    }

    clearAllReservations(): void {
        getTables(this).forEach((table) => {
            table.setFill(table.baseFill);
            table.setVIPStatus(false);
        });
        this.canvas.requestRenderAll();
    }

    resize(pageContainerWidth: number): void {
        this.containerWidth = pageContainerWidth;
        this.scale = calculateCanvasScale(this.containerWidth, this.floorDoc.width);
        this.setScaling();
        this.zoomManager.setScale(this.scale);
    }

    abstract onFloorDoubleTap(coordinates: [x: number, y: number]): void;
    abstract emit(event: string, ...args: unknown[]): void;
    abstract on(event: string, listener: any): void;
    abstract destroy(): void;
    protected abstract onElementClick(ev: FabricObject): void;
    protected abstract setElementProperties(element: FabricObject): void;
}
