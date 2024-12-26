import type { FabricObject } from "fabric";
import type { FloorCreationOptions, FloorEditorElement, ToTuple } from "./types.js";
import { Floor } from "./Floor.js";
import { ViewerEventManager } from "./event-manager/ViewerEventManager.js";
import { isTable } from "./type-guards.js";
import { EventEmitter } from "@posva/event-emitter";

type FloorViewerEvents = {
    elementClicked: [FloorViewer, FloorEditorElement];
    rendered: [];
};

export class FloorViewer extends Floor {
    protected eventManager: ViewerEventManager;

    private readonly eventEmitter: EventEmitter<FloorViewerEvents>;

    constructor(options: FloorCreationOptions) {
        super(options);
        this.eventEmitter = new EventEmitter<FloorViewerEvents>();
        this.eventManager = new ViewerEventManager(this);
        this.canvas.defaultCursor = "default";
    }

    emit<T extends keyof FloorViewerEvents>(
        event: T,
        ...args: ToTuple<FloorViewerEvents[T]>
    ): void {
        this.eventEmitter.emit(event, ...args);
    }

    on<T extends keyof FloorViewerEvents>(
        event: T,
        listener: (...args: ToTuple<FloorViewerEvents[T]>) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    off<T extends keyof FloorViewerEvents>(
        event: T,
        listener: (...args: ToTuple<FloorViewerEvents[T]>) => void,
    ): void {
        this.eventEmitter.off(event, listener);
    }

    onFloorDoubleTap(): void {
        /* empty for now */
    }

    /**
     * This can throw so it should be called in a try/catch block
     */
    async destroy(): Promise<void> {
        this.eventManager.destroy();
        this.zoomManager.destroy();
        this.touchManager.destroy();
        await this.canvas.dispose();
    }

    protected onElementClick = (obj: FabricObject): void => {
        if (this.touchManager.isInteracting || this.zoomManager.isZooming) {
            return;
        }
        this.eventEmitter.emit("elementClicked", this, obj as FloorEditorElement);
    };

    protected setElementProperties(element: FabricObject): void {
        element.lockScalingX = true;
        element.lockScalingY = true;
        element.lockMovementX = true;
        element.lockMovementY = true;
        element.lockScalingFlip = true;
        element.lockRotation = true;
        element.lockSkewingX = true;
        element.lockSkewingY = true;

        // Override the cursor style on hover for all elements in viewer
        element.hoverCursor = "default";
        element.selectable = false;

        if (!isTable(element)) {
            element.evented = false;
        }
    }
}
