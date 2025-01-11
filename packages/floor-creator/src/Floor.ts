import type { FabricObject } from "fabric";
import type { BaseTable, FloorCreationOptions, FloorData } from "./types.js";
import type { EventManager } from "./event-manager/EventManager.js";
import { CANVAS_BG_COLOR, DEFAULT_FONT } from "./constants.js";
import { TouchManager } from "./TouchManager.js";
import { FloorZoomManager } from "./FloorZoomManager.js";
import { calculateCanvasScale } from "./utils.js";
import { isTable } from "./type-guards.js";
import { getTables } from "./filters.js";
import { RectTable } from "./elements/RectTable.js";
import { Wall } from "./elements/Wall.js";
import { RoundTable } from "./elements/RoundTable.js";
import { EditableShape } from "./elements/EditableShape.js";
import { FabricText, Canvas, classRegistry } from "fabric";

classRegistry.setClass(RectTable);
classRegistry.setClass(RoundTable);
classRegistry.setClass(Wall);
classRegistry.setClass(EditableShape);

FabricText.ownDefaults.fontFamily = DEFAULT_FONT;

export abstract class Floor {
    readonly id: string;
    name: string;
    scale: number;
    height: number;
    readonly floorDoc: FloorData;
    readonly canvas: Canvas;
    width: number;
    containerWidth: number;
    containerHeight: number;
    touchManager: TouchManager;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

    protected constructor(options: FloorCreationOptions) {
        const { canvas, floorDoc, containerWidth, containerHeight } = options;

        this.scale = calculateCanvasScale(
            containerWidth,
            containerHeight,
            floorDoc.width,
            floorDoc.height,
        );
        this.id = floorDoc.id;
        this.name = floorDoc.name;
        this.width = floorDoc.width;
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
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
        this.renderJSONData(this.floorDoc.json);

        this.zoomManager = new FloorZoomManager(this);

        this.touchManager = new TouchManager(this);

        this.canvas.on("object:added", (e) => {
            e.target.on("mouseup", () => {
                this.onElementClick(e.target);
            });
        });
    }

    setObjectCoords(): void {
        this.canvas.forEachObject(function (object) {
            object.setCoords();
        });
    }

    setScaling(): void {
        this.canvas.setZoom(this.scale);
        this.canvas.setDimensions({
            width: this.width * this.canvas.getZoom(),
            height: this.height * this.canvas.getZoom(),
        });
        this.setObjectCoords();
    }

    async renderJSONData(jsonData?: FloorData["json"]): Promise<void> {
        if (!jsonData) {
            return;
        }
        const canvas = await this.canvas.loadFromJSON(jsonData, (_, object) => {
            this.setElementProperties(object as FabricObject);
        });

        this.emit("rendered");
        return canvas.requestRenderAll();
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

    resize(pageContainerWidth: number, pageContainerHeight: number): void {
        this.containerWidth = pageContainerWidth;
        this.containerHeight = pageContainerHeight;
        this.scale = calculateCanvasScale(
            this.containerWidth,
            this.containerHeight,
            this.floorDoc.width,
            this.floorDoc.height,
        );
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
