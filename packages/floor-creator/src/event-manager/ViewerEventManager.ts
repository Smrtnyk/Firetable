import type { Floor } from "../Floor.js";

import { EventManager } from "./EventManager.js";

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
