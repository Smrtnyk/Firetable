import { Floor } from "./Floor";
import { fabric } from "fabric";
import { BaseTable, FloorCreationOptions, FloorEditorElement } from "./types";
import { ViewerEventManager } from "./event-manager/ViewerEventManager";
import { EventEmitter } from "./event-emitter/EventEmitter";

type FloorViewerEvents = {
    elementClicked: [FloorViewer, FloorEditorElement];
    tableToTable: [FloorViewer, BaseTable, BaseTable];
};

export class FloorViewer extends Floor {
    protected eventManager: ViewerEventManager;

    private eventEmitter: EventEmitter<FloorViewerEvents>;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.canvas.interactive = false;
        this.eventEmitter = new EventEmitter<FloorViewerEvents>();
        this.eventManager = new ViewerEventManager(this);
        this.canvas.defaultCursor = "default";
    }

    emit<T extends keyof FloorViewerEvents>(event: T, ...args: FloorViewerEvents[T]): void {
        this.eventEmitter.emit(event, ...args);
    }

    on<T extends keyof FloorViewerEvents>(
        event: T,
        listener: (...args: FloorViewerEvents[T]) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    onFloorDoubleTap(): void {
        /* empty for now */
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>): void => {
        if (this.touchManager.isInteracting || this.zoomManager.isZooming) {
            return;
        }
        if (this.eventManager.dragOccurred) {
            this.eventManager.dragOccurred = false; // Reset the flag
            return; // Exit early if a drag operation occurred
        }
        this.eventEmitter.emit("elementClicked", this, ev.target as FloorEditorElement);
    };

    protected setElementProperties(element: fabric.Object): void {
        element.lockScalingX = true;
        element.lockScalingY = true;
        element.lockMovementX = true;
        element.lockMovementY = true;
        element.lockScalingFlip = true;
        element.lockRotation = true;
        element.lockSkewingX = true;
        element.lockSkewingY = true;
        element.lockUniScaling = true;

        // Override the cursor style on hover for all elements in viewer
        element.hoverCursor = "default";
    }

    destroy(): void {
        this.eventManager.destroy();
        this.zoomManager.destroy();
        this.touchManager.destroy();
        this.canvas.dispose();
    }
}
