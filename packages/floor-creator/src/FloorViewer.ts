import { Floor } from "./Floor";
import { fabric } from "fabric";
import { FloorCreationOptions, FloorEditorElement } from "./types";
import { ViewerEventManager } from "./event-manager/ViewerEventManager";

export class FloorViewer extends Floor {
    protected eventManager: ViewerEventManager;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventManager = new ViewerEventManager(this);
        this.initializeCanvasEventHandlers();
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        // Check if there was a move operation. If there was, just return.
        if (this.eventManager.hasMouseMoved) return;

        this.elementClickHandler(this, ev.target as FloorEditorElement);
    };

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
