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
        this.eventEmitter = new EventEmitter<FloorViewerEvents>();
        this.eventManager = new ViewerEventManager(this);
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
    }

    destroy(): void {
        // NOOP here
    }
}
