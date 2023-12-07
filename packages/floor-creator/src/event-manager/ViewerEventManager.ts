import type { Floor } from "../Floor";
import { EventManager } from "./EventManager";

export class ViewerEventManager extends EventManager {
    constructor(floor: Floor) {
        super(floor);

        this.initializeCanvasEventHandlers();
    }

    destroy(): void {
        // NOOP here
    }

    override initializeCanvasEventHandlers(): void {
        super.initializeCanvasEventHandlers();
    }
}
