import { Floor } from "./Floor";
import { fabric } from "fabric";
import { CreateElementOptions, FloorCreationOptions, FloorEditorElement } from "./types";
import { EventManager } from "./event-manager/EventManager";
import { ElementManager } from "./ElementManager";
import { FloorDoc } from "@firetable/types";
import { GridDrawer } from "./GridDrawer";
import { EditorEventManager } from "./event-manager/EditorEventManager";

export class FloorEditor extends Floor {
    protected eventManager: EventManager;
    private elementManager: ElementManager;
    private gridDrawer: GridDrawer;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.gridDrawer = new GridDrawer(this.canvas);
        this.eventManager = new EditorEventManager(this);
        this.elementManager = new ElementManager();
        this.initializeCanvasEventHandlers();
        this.renderGrid();
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        this.elementClickHandler(this, ev.target as FloorEditorElement);
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
        this.renderData(this.floorDoc.json);
    }

    setFloorName(newName: string) {
        this.name = newName;
    }
}
