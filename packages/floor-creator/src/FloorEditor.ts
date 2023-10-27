import { Floor } from "./Floor";
import { fabric } from "fabric";
import { CreateElementOptions, FloorCreationOptions } from "./types";
import { EventManager } from "./EventManager";

export class FloorEditor extends Floor {
    protected eventManager: EventManager;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventManager = new EventManager(this);
        this.initializeCanvasEventHandlers();
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
}
