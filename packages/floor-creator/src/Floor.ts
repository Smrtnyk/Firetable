import type { FabricObject } from "fabric";

import { matchesProperty } from "es-toolkit/compat";
import { Canvas, classRegistry, FabricText } from "fabric";

import type { EventManager } from "./event-manager/EventManager.js";
import type { BaseTable, FloorCreationOptions, FloorData } from "./types.js";

import { CANVAS_BG_COLOR, DEFAULT_FONT } from "./constants.js";
import { EditableShape } from "./elements/EditableShape.js";
import { RectTable } from "./elements/RectTable.js";
import { RoundTable } from "./elements/RoundTable.js";
import { Wall } from "./elements/Wall.js";
import { getTables } from "./filters.js";
import { FloorZoomManager } from "./FloorZoomManager.js";
import { TouchManager } from "./TouchManager.js";
import { calculateCanvasScale } from "./utils.js";

classRegistry.setClass(RectTable);
classRegistry.setClass(RoundTable);
classRegistry.setClass(Wall);
classRegistry.setClass(EditableShape);

FabricText.ownDefaults.fontFamily = DEFAULT_FONT;

export abstract class Floor {
    readonly canvas: Canvas;
    containerHeight: number;
    containerWidth: number;
    readonly floorDoc: FloorData;
    height: number;
    readonly id: string;
    name: string;
    scale: number;
    touchManager: TouchManager;
    width: number;
    zoomManager: FloorZoomManager;

    protected abstract eventManager: EventManager;

    protected constructor(options: FloorCreationOptions) {
        const { canvas, containerHeight, containerWidth, floorDoc } = options;

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
            backgroundColor: CANVAS_BG_COLOR,
            height: this.height,
            selection: false,
            skipOffscreen: true,
            width: this.width,
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

    clearAllReservations(): void {
        getTables(this).forEach((table) => {
            table.setFill(table.baseFill);
            table.setVIPStatus(false);
        });
        this.canvas.requestRenderAll();
    }

    abstract destroy(): void;

    abstract emit(event: string, ...args: unknown[]): void;

    getTableByLabel(tableLabel: string): BaseTable | undefined {
        return getTables(this).find(matchesProperty("label", tableLabel));
    }

    abstract on(event: string, listener: any): void;

    abstract onFloorDoubleTap(coordinates: [x: number, y: number]): void;

    async renderJSONData(jsonData?: FloorData["json"]): Promise<void> {
        if (!jsonData) {
            return;
        }
        const canvas = await this.canvas.loadFromJSON(jsonData, (_, object) => {
            this.setElementProperties(object as FabricObject);
        });

        this.emit("rendered");
        canvas.requestRenderAll();
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
        this.zoomManager.resetZoom();
    }
    setObjectCoords(): void {
        this.canvas.forEachObject(function (object) {
            object.setCoords();
        });
    }
    setScaling(): void {
        this.canvas.setZoom(this.scale);
        this.canvas.setDimensions({
            height: this.height * this.canvas.getZoom(),
            width: this.width * this.canvas.getZoom(),
        });
        this.setObjectCoords();
    }
    protected abstract onElementClick(ev: FabricObject): void;
    protected abstract setElementProperties(element: FabricObject): void;
}
