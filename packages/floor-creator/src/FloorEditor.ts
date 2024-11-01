import type { FabricObject } from "fabric";
import type { EventManager } from "./event-manager/EventManager.js";
import type {
    CreateElementOptions,
    FloorCreationOptions,
    FloorData,
    FloorDropEvent,
    FloorEditorElement,
    NumberTuple,
    ToTuple,
} from "./types.js";
import { ElementManager } from "./ElementManager.js";
import { Floor } from "./Floor.js";
import { GridDrawer } from "./GridDrawer.js";
import { EditorEventManager } from "./event-manager/EditorEventManager.js";
import { calculateCanvasScale } from "./utils.js";
import { CanvasHistory } from "./CanvasHistory.js";
import { ActiveSelection } from "fabric";
import { initAligningGuidelines } from "fabric/extensions";
import { EventEmitter } from "@posva/event-emitter";

type FloorEditorEvents = {
    elementClicked: [FloorEditor, FloorEditorElement];
    doubleClick: [FloorEditor, NumberTuple];
    historyChange: [];
    rendered: [undefined];
    drop: [FloorEditor, FloorDropEvent];
};

export class FloorEditor extends Floor {
    readonly gridDrawer: GridDrawer;
    readonly history: CanvasHistory;
    protected eventManager: EventManager;
    private readonly elementManager: ElementManager;
    private readonly eventEmitter: EventEmitter<FloorEditorEvents>;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventEmitter = new EventEmitter<FloorEditorEvents>();
        this.gridDrawer = new GridDrawer(this.canvas);
        this.history = new CanvasHistory(this, { maxStackSize: 20 });
        this.eventManager = new EditorEventManager(this, this.history);
        this.elementManager = new ElementManager();

        if (options.floorDoc.json) {
            this.on("rendered", () => {
                this.renderGrid();
                this.history.initialize();
                this.history.on("stateChange", () => {
                    this.emit("historyChange");
                });
            });
        } else {
            this.renderGrid();
            this.history.initialize();
            this.history.on("stateChange", () => {
                this.emit("historyChange");
            });
        }

        initAligningGuidelines(this.canvas);
    }

    canUndo(): boolean {
        return this.history.canUndo();
    }

    canRedo(): boolean {
        return this.history.canRedo();
    }

    async undo(): Promise<void> {
        await this.history.undo();
    }

    async redo(): Promise<void> {
        await this.history.redo();
    }

    emit<T extends keyof FloorEditorEvents>(
        event: T,
        ...args: ToTuple<FloorEditorEvents[T]>
    ): void {
        this.eventEmitter.emit(event, ...args);
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

    addElement(options: CreateElementOptions): void {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", () => {
            this.onElementClick(element);
        });
        this.setElementProperties(element);
        this.canvas.add(element);
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
            cloned.on("mouseup", () => {
                this.onElementClick(cloned);
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

    toggleGridVisibility = (): void => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    updateDimensions(newWidth: number, newHeight: number): void {
        this.width = newWidth;
        this.height = newHeight;
        this.scale = calculateCanvasScale(this.containerWidth, this.width);
        this.setScaling();
        this.canvas.requestRenderAll();
        this.renderGrid();
    }

    setFloorName(newName: string): void {
        this.name = newName;
    }

    /**
     * This can throw an error so it should be called in a try-catch block
     */
    async destroy(): Promise<void> {
        this.eventManager.destroy();
        this.zoomManager.destroy();
        this.touchManager.destroy();
        this.history.destroy();
        await this.canvas.dispose();
    }

    renderGrid(): void {
        this.gridDrawer.drawGrid(this.width, this.height);
    }

    override async renderData(jsonData?: FloorData["json"]): Promise<void> {
        await super.renderData(jsonData);
    }

    async importFloor(
        jsonImport: { width: number; height: number; json: string },
        preserveZoom = false,
    ): Promise<void> {
        this.width = jsonImport.width;
        this.height = jsonImport.height;

        if (!preserveZoom) {
            super.resize(this.containerWidth);
        }

        await this.renderData(JSON.parse(jsonImport.json));
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
