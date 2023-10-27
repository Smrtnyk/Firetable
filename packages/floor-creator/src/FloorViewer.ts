import { Floor } from "./Floor";
import { fabric } from "fabric";
import { FloorCreationOptions } from "./types";
import { EventManager } from "./EventManager";

export class FloorViewer extends Floor {
    protected eventManager: EventManager;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventManager = new EventManager(this);
        this.initializeCanvasEventHandlers();
    }

    initializeCanvasEventHandlers() {
        // Put all the event logic for the viewer here
        this.eventManager?.initializeCanvasEventHandlers();
    }

    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = true;
        element.lockScalingY = true;
        element.lockMovementX = true;
        element.lockMovementY = true;
        element.lockScalingFlip = true;
    }
}
