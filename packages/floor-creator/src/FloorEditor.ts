import { Floor } from "./Floor";
import { fabric } from "fabric";
import {
    CreateElementOptions,
    FloorCreationOptions,
    FloorEditorElement,
    NumberTuple,
} from "./types";
import { EventManager } from "./event-manager/EventManager";
import { ElementManager } from "./ElementManager";
import { FloorDoc } from "@firetable/types";
import { GridDrawer } from "./GridDrawer";
import { EditorEventManager } from "./event-manager/EditorEventManager";
import { calculateCanvasScale } from "./utils";
import { CommandInvoker } from "./command/CommandInvoker";
import { EventEmitter } from "./event-emitter/EventEmitter";

type FloorEditorEvents = {
    elementClicked: [FloorEditor, FloorEditorElement];
    doubleClick: [FloorEditor, NumberTuple];
    commandChange: [];
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

        this.renderGrid();
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

    emit<T extends keyof FloorEditorEvents>(event: T, ...args: FloorEditorEvents[T]) {
        this.eventEmitter.emit(event, ...args);
    }

    on<T extends keyof FloorEditorEvents>(
        event: T,
        listener: (...args: FloorEditorEvents[T]) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    onFloorDoubleTap(coordinates: [x: number, y: number]) {
        this.eventEmitter.emit("doubleClick", this, coordinates);
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        this.eventEmitter.emit("elementClicked", this, ev.target as FloorEditorElement);
    };

    renderGrid() {
        this.gridDrawer.drawGrid(this.width, this.height);
    }

    renderData(jsonData?: FloorDoc["json"]) {
        super.renderData(jsonData);
    }

    initializeCanvasEventHandlers() {
        this.eventManager?.initializeCanvasEventHandlers();
    }

    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = false;
        element.lockScalingY = false;
        element.lockMovementX = false;
        element.lockMovementY = false;
        element.lockScalingFlip = true;
    }

    addElement(options: CreateElementOptions) {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", this.onElementClick);
        this.setElementProperties(element);
        this.canvas.add(element);
    }

    toggleGridVisibility = () => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.scale = calculateCanvasScale(this.containerWidth, this.width);
        this.setScaling();
        this.renderData(this.floorDoc.json);
        this.renderGrid();
    }

    setFloorName(newName: string) {
        this.name = newName;
    }

    destroy() {
        this.eventManager.destroy();
    }
}
