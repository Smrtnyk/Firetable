import { Floor } from "./Floor";
import { fabric } from "fabric";
import { CreateElementOptions, FloorCreationOptions } from "./types";
import { EventManager } from "./EventManager";
import { ElementManager } from "./ElementManager";
import { FloorDoc } from "@firetable/types";

export class FloorEditor extends Floor {
    protected eventManager: EventManager;
    private elementManager: ElementManager;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventManager = new EventManager(this);
        this.elementManager = new ElementManager();
        this.initializeCanvasEventHandlers();
    }

    renderData(jsonData?: FloorDoc["json"]) {
        super.renderData(jsonData);
        this.gridDrawer.drawGrid(this.width, this.height);
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
}
