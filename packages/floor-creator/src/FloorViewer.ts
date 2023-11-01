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

    onFloorDoubleTap() {
        /* empty for now */
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        if (this.eventManager.dragOccurred) {
            this.eventManager.dragOccurred = false; // Reset the flag
            return; // Exit early if a drag operation occurred
        }
        this.elementClickHandler(this, ev.target as FloorEditorElement);
    };

    initializeCanvasEventHandlers() {
        this.eventManager?.initializeCanvasEventHandlers();
    }

    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = true;
        element.lockScalingY = true;
        element.lockMovementX = true;
        element.lockMovementY = true;
        element.lockScalingFlip = true;
    }

    destroy() {}
}
