import { EventManager } from "./EventManager";
import type { Floor } from "../Floor";

export class ViewerEventManager extends EventManager {
    constructor(floor: Floor) {
        super(floor);

        this.initializeCanvasEventHandlers();
    }

    destroy(): void {
        // NOOP here
    }

    initializeCanvasEventHandlers(): void {
        super.initializeCanvasEventHandlers();
    }
}
