import type { FabricObject } from "fabric";
import type { EventManager } from "./event-manager/EventManager";
import type {
    CreateElementOptions,
    FloorCreationOptions,
    FloorData,
    FloorDropEvent,
    FloorEditorElement,
    NumberTuple,
} from "./types";
import { ElementManager } from "./ElementManager";
import { Floor } from "./Floor";
import { GridDrawer } from "./GridDrawer";
import { EditorEventManager } from "./event-manager/EditorEventManager";
import { calculateCanvasScale } from "./utils";
import { CommandInvoker } from "./command/CommandInvoker";
import { EventEmitter } from "./event-emitter/EventEmitter";

type FloorEditorEvents = {
    elementClicked: [FloorEditor, FloorEditorElement];
    doubleClick: [FloorEditor, NumberTuple];
    commandChange: [];
    rendered: [undefined];
    drop: [FloorEditor, FloorDropEvent];
};

export class FloorEditor extends Floor {
    protected eventManager: EventManager;
    private elementManager: ElementManager;
    private gridDrawer: GridDrawer;
    private eventEmitter: EventEmitter<FloorEditorEvents>;
    private commandInvoker = new CommandInvoker();

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventEmitter = new EventEmitter<FloorEditorEvents>();
        this.gridDrawer = new GridDrawer(this.canvas);
        this.eventManager = new EditorEventManager(this, this.commandInvoker);
        this.elementManager = new ElementManager();

        this.commandInvoker.on("change", () => {
            this.emit("commandChange");
        });

        this.on("rendered", this.renderGrid.bind(this));
        if (!options.floorDoc.json) {
            this.renderGrid();
        }
    }

    canUndo(): boolean {
        return this.commandInvoker.canUndo();
    }

    canRedo(): boolean {
        return this.commandInvoker.canRedo();
    }

    undo(): void {
        return this.commandInvoker.undo();
    }

    redo(): void {
        return this.commandInvoker.redo();
    }

    emit<T extends keyof FloorEditorEvents>(event: T, ...args: FloorEditorEvents[T]): void {
        this.eventEmitter.emit(event, ...args);
    }

    on<T extends keyof FloorEditorEvents>(
        event: T,
        listener: (...args: FloorEditorEvents[T]) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    onFloorDoubleTap(coordinates: [x: number, y: number]): void {
        this.emit("doubleClick", this, coordinates);
    }

    protected onElementClick = (obj: FabricObject): void => {
        this.emit("elementClicked", this, obj as FloorEditorElement);
    };

    renderGrid(): void {
        this.gridDrawer.drawGrid(this.width, this.height);
    }

    override renderData(jsonData?: FloorData["json"]): void {
        super.renderData(jsonData);
    }

    importFloor(jsonImport: { width: number; height: number; json: string }): void {
        this.width = jsonImport.width;
        this.height = jsonImport.height;
        super.resize(this.containerWidth);
        this.renderData(JSON.parse(jsonImport.json));
    }

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

    addElement(options: CreateElementOptions): void {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", () => {
            this.onElementClick(element);
        });
        this.setElementProperties(element);
        this.canvas.add(element);
    }

    toggleGridVisibility = (): void => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    updateDimensions(newWidth: number, newHeight: number): void {
        this.width = newWidth;
        this.height = newHeight;
        this.scale = calculateCanvasScale(this.containerWidth, this.width);
        this.setScaling();
        this.renderData(this.floorDoc.json);
        this.renderGrid();
    }

    setFloorName(newName: string): void {
        this.name = newName;
    }

    destroy(): void {
        this.eventManager.destroy();
        this.zoomManager.destroy();
        this.touchManager.destroy();
        this.canvas.dispose().catch(console.error);
    }
}
