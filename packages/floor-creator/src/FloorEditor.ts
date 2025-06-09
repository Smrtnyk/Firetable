import type { FabricObject } from "fabric";

import { EventEmitter } from "@posva/event-emitter";
import { ActiveSelection, InteractiveFabricObject } from "fabric";

import type { DrawingOptions } from "./DrawingManager.js";
import type { EventManager } from "./event-manager/EventManager.js";
import type {
    CreateElementOptions,
    FloorCreationOptions,
    FloorDropEvent,
    FloorEditorElement,
    NumberTuple,
    ToTuple,
} from "./types.js";

import { CanvasHistory } from "./CanvasHistory.js";
import { DrawingManager } from "./DrawingManager.js";
import { ElementManager } from "./ElementManager.js";
import { EditorEventManager } from "./event-manager/EditorEventManager.js";
import { initAligningGuidelines } from "./fabric-patches/aligning-guidelines/index.js";
import { Floor } from "./Floor.js";
import { GridDrawer } from "./GridDrawer.js";
import { calculateCanvasScale } from "./utils.js";

type FloorEditorEvents = {
    doubleClick: [FloorEditor, NumberTuple];
    drop: [FloorEditor, FloorDropEvent];
    elementClicked: [FloorEditor, FloorEditorElement];
    historyChange: [];
    rendered: [undefined];
};

InteractiveFabricObject.ownDefaults = {
    ...InteractiveFabricObject.ownDefaults,
    borderColor: "orange",
    cornerColor: "lightblue",
    cornerStrokeColor: "blue",
    cornerStyle: "circle",
    transparentCorners: false,
};
export class FloorEditor extends Floor {
    readonly gridDrawer: GridDrawer;
    readonly history: CanvasHistory;
    protected drawingManager: DrawingManager;
    protected eventManager: EventManager;
    private readonly elementManager: ElementManager;
    private readonly eventEmitter: EventEmitter<FloorEditorEvents>;

    constructor(options: FloorCreationOptions) {
        super(options);

        initAligningGuidelines(this.canvas);
        this.eventEmitter = new EventEmitter<FloorEditorEvents>();
        this.gridDrawer = new GridDrawer(this.canvas);
        this.history = new CanvasHistory(this);
        this.eventManager = new EditorEventManager(this, this.history);
        this.elementManager = new ElementManager();
        this.drawingManager = new DrawingManager(this.canvas);

        if (options.floorDoc.json) {
            this.on("rendered", () => {
                this.setupOnRendered();
            });
        } else {
            this.setupOnRendered();
        }
    }

    addElement(options: CreateElementOptions): void {
        const element = this.elementManager.addElement(options);

        this.setElementProperties(element);
        this.canvas.add(element);
    }

    canRedo(): boolean {
        return this.history.canRedo();
    }

    canUndo(): boolean {
        return this.history.canUndo();
    }

    clear(): void {
        this.canvas.remove(...this.canvas.getObjects());
    }

    clearDrawings(): void {
        this.drawingManager.clearDrawings();
    }

    async copySelectedElement(): Promise<void> {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const cloned = await activeObject.clone();
            this.canvas.discardActiveObject();
            cloned.set({
                left: cloned.left + 10,
                top: cloned.top + 10,
            });
            if (cloned instanceof ActiveSelection) {
                cloned.canvas = this.canvas;
                cloned.forEachObject((obj) => {
                    this.canvas.add(obj);
                });
                cloned.setCoords();
            } else {
                this.canvas.add(cloned);
            }
            this.canvas.setActiveObject(cloned);
            this.canvas.requestRenderAll();
        }
    }

    /**
     * This can throw an error so it should be called in a try-catch block
     */
    async destroy(): Promise<void> {
        this.eventManager.destroy();
        this.zoomManager.destroy();
        this.touchManager.destroy();
        this.drawingManager.destroy();
        this.history.destroy();
        await this.canvas.dispose();
    }

    emit<T extends keyof FloorEditorEvents>(
        event: T,
        ...args: ToTuple<FloorEditorEvents[T]>
    ): void {
        this.eventEmitter.emit(event, ...args);
    }

    export(additionalFields: string[] = []): { height: number; json: string; width: number } {
        const json = this.canvas.toDatalessJSON(["label", "name", "type", ...additionalFields]);
        return {
            height: this.height,
            json: JSON.stringify(json),
            width: this.width,
        };
    }

    getBackgroundColor(): string {
        const bgColor = this.canvas.backgroundColor;
        return bgColor.toString();
    }

    async importFloor(jsonImport: { height: number; json: string; width: number }): Promise<void> {
        this.width = jsonImport.width;
        this.height = jsonImport.height;

        super.resize(this.container);

        await this.renderJSONData(JSON.parse(jsonImport.json));
    }

    isDirty(): boolean {
        return this.history.hasUnsavedChanges();
    }

    markAsSaved(): void {
        this.history.markAsSaved();
    }

    on<T extends keyof FloorEditorEvents>(
        event: T,
        listener: (...args: ToTuple<FloorEditorEvents[T]>) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    onFloorDoubleTap(coordinates: [x: number, y: number]): void {
        this.emit("doubleClick", this, coordinates);
    }

    async redo(): Promise<void> {
        await this.history.redo();
    }

    requestGridRender(): void {
        this.gridDrawer.requestGridDraw(this.width, this.height);
    }

    setBackgroundColor(color: string): void {
        this.canvas.backgroundColor = color;
        this.canvas.fire("object:modified");
        this.canvas.requestRenderAll();
    }

    setBrushColor(color: string): void {
        this.drawingManager.setBrushColor(color);
    }

    setBrushType(type: "circle" | "pencil" | "spray"): void {
        this.drawingManager.setBrushType(type);
    }

    setBrushWidth(width: number): void {
        this.drawingManager.setBrushWidth(width);
    }

    setDrawingMode(enabled: boolean, options?: DrawingOptions): void {
        if (enabled) {
            this.drawingManager.enable(options);
        } else {
            this.drawingManager.disable();
        }
    }

    setElementFill(element: FloorEditorElement, fill: string): void {
        element.setBaseFill(fill);
        this.canvas.fire("object:modified", { target: element });
        this.canvas.requestRenderAll();
    }

    setFloorName(newName: string): void {
        this.name = newName;
    }

    setupOnRendered(): void {
        this.history.initialize();
        this.gridDrawer.drawGrid(this.width, this.height);
    }

    toggleGridVisibility = (): void => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    async undo(): Promise<void> {
        await this.history.undo();
    }

    updateDimensions(newWidth: number, newHeight: number): void {
        if (this.width === newWidth && this.height === newHeight) {
            return;
        }

        this.width = newWidth;
        this.height = newHeight;
        this.scale = calculateCanvasScale(
            this.container.clientWidth,
            this.container.clientHeight,
            this.width,
            this.height,
        );
        this.setScaling();

        this.zoomManager.setScale(this.scale);
        this.zoomManager.resetZoom();

        this.canvas.fire("object:modified");
        this.canvas.requestRenderAll();
        this.requestGridRender();
    }

    protected onElementClick = (obj: FabricObject): void => {
        this.emit("elementClicked", this, obj as FloorEditorElement);
    };

    protected setElementProperties(element: FabricObject): void {
        element.lockScalingX = false;
        element.lockScalingY = false;
        element.lockMovementX = false;
        element.lockMovementY = false;
        element.lockScalingFlip = true;
        element.lockRotation = false;
        element.lockSkewingX = false;
        element.lockSkewingY = false;
    }
}
