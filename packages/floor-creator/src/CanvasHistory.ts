import type { FloorEditor } from "./FloorEditor.js";
import type { FabricObject } from "fabric";
import { canvasToRender } from "./utils.js";
import { cloneDeep, isEqual, Mutex, once } from "es-toolkit";
import { patch, diff } from "jsondiffpatch";

export interface HistoryState {
    width: number;
    height: number;
    json: string;
}

interface InternalState {
    width: number;
    height: number;
    /**
     * parsed canvas state
     */
    canvas: Record<string, unknown>;
}

interface DeltaEntry {
    /**
     * computed as: diff(lastInternalState, currentInternalState)
     */
    patched: any;
    /**
     * computed as: diff(currentInternalState, lastInternalState)
     */
    inversePatch: any;
}

interface NormalizedCanvasObject {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    fill: FabricObject["fill"];
    stroke: FabricObject["stroke"];
    objects?: NormalizedCanvasObject[];
}

export interface CanvasHistoryOptions {
    maxStackSize?: number;
}

const DEFAULT_MAX_STACK_SIZE = 50;

export class CanvasHistory {
    /**
     * The one-time initializer that sets up the baseline state.
     */
    initialize = once((): void => {
        const initialState = this.getCanvasState();
        this.lastInternalState = this.toInternalState(initialState);
        this.attachEventListeners();
        this.isInitializing = false;
        this.markAsSaved();
    });

    private readonly mutex = new Mutex();
    private readonly floor: FloorEditor;
    private readonly maxStackSize: number;
    private lastSavedJson: HistoryState;
    private isDirty: boolean;
    private undoStack: DeltaEntry[];
    private redoStack: DeltaEntry[];
    /**
     * The last known internal state (used for computing deltas)
     */
    private lastInternalState: InternalState;
    /**
     * This flag prevents history recordings while an undo/redo is in progress.
     */
    private isHistoryProcessing: boolean;
    private isInitializing: boolean;
    private readonly handlers: {
        "object:modified": () => void;
        "object:added": () => void;
        "object:removed": () => void;
    };

    constructor(floor: FloorEditor, options: CanvasHistoryOptions = {}) {
        this.floor = floor;
        this.maxStackSize = options.maxStackSize ?? DEFAULT_MAX_STACK_SIZE;
        this.undoStack = [];
        this.redoStack = [];
        this.isHistoryProcessing = false;
        this.isInitializing = true;
        const initialState = this.getCanvasState();
        this.lastSavedJson = initialState;
        this.lastInternalState = this.toInternalState(initialState);
        this.isDirty = false;

        this.handlers = {
            "object:modified": this.onCanvasModified.bind(this),
            "object:added": this.onCanvasModified.bind(this),
            "object:removed": this.onCanvasModified.bind(this),
        };
    }

    static normalize(canvasObjects: FabricObject[]): NormalizedCanvasObject[] {
        return canvasObjects.map(function (obj) {
            const { left, top, width, height, scaleX, scaleY, angle, fill, stroke } = obj;

            if ("objects" in obj) {
                return {
                    left,
                    top,
                    width,
                    height,
                    scaleX,
                    scaleY,
                    angle,
                    fill,
                    stroke,
                    objects: CanvasHistory.normalize(obj["objects"] as FabricObject[]),
                };
            }
            return { left, top, width, height, scaleX, scaleY, angle, fill, stroke };
        });
    }

    /**
     * Marks the current state as saved (e.g. after a save operation).
     */
    markAsSaved(): void {
        this.lastSavedJson = this.getCanvasState();
        this.isDirty = false;
        this.floor.emit("historyChange");
    }

    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }

    destroy(): void {
        this.detachEventListeners();
        this.clear();
    }

    canUndo(): boolean {
        // If there’s at least one delta recorded, we can undo.
        return this.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    async undo(): Promise<void> {
        try {
            await this.mutex.acquire();
            if (!this.canUndo()) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it is here otherwise canUndo would return false
            const deltaEntry = this.undoStack.pop()!;
            // 1. Apply the inverse patch to the last known internal state.
            const currentInternal = this.lastInternalState;
            // 2. Create a deep copy to avoid side effects.
            let revertedInternal = cloneDeep(currentInternal);
            revertedInternal = patch(revertedInternal, deltaEntry.inversePatch) as InternalState;
            // 3. Update our last known internal state.
            this.lastInternalState = revertedInternal;
            // 4. Push this delta entry onto the redo stack.
            this.redoStack.push(deltaEntry);
            if (this.redoStack.length > this.maxStackSize) {
                this.redoStack.shift();
            }
            // 5. Load the previous state into the canvas.
            const previousState = this.fromInternalState(revertedInternal);
            await this.loadState(previousState);
        } finally {
            this.mutex.release();
        }
    }

    async redo(): Promise<void> {
        try {
            await this.mutex.acquire();
            if (!this.canRedo()) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it is here otherwise canRedo would return false
            const deltaEntry = this.redoStack.pop()!;
            const currentInternal = this.lastInternalState;
            let redoneInternal = cloneDeep(currentInternal);
            redoneInternal = patch(redoneInternal, deltaEntry.patched) as InternalState;
            // 1. Update our last known internal state.
            this.lastInternalState = redoneInternal;
            // 2. Push this delta entry back to the undo stack.
            this.undoStack.push(deltaEntry);
            if (this.undoStack.length > this.maxStackSize) {
                this.undoStack.shift();
            }
            const newState = this.fromInternalState(redoneInternal);
            await this.loadState(newState);
        } finally {
            this.mutex.release();
        }
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.floor.emit("historyChange");
    }

    /**
     * Converts a HistoryState (which contains a JSON string) into an InternalState
     * that we can diff.
     */
    private toInternalState(state: HistoryState): InternalState {
        return {
            width: state.width,
            height: state.height,
            canvas: JSON.parse(state.json),
        };
    }

    /**
     * Converts an InternalState back to a HistoryState.
     */
    private fromInternalState(internal: InternalState): HistoryState {
        return {
            width: internal.width,
            height: internal.height,
            json: JSON.stringify(internal.canvas),
        };
    }

    /**
     * Captures the full state of the canvas (including dimensions and JSON data).
     */
    private getCanvasState(): HistoryState {
        return {
            ...this.floor.export([
                "left",
                "top",
                "width",
                "height",
                "scaleX",
                "scaleY",
                "angle",
                "fill",
                "stroke",
                "baseFill",
            ]),
        };
    }

    private attachEventListeners(): void {
        this.floor.canvas.on(this.handlers);
    }

    private detachEventListeners(): void {
        this.floor.canvas.off(this.handlers);
    }

    /**
     * Called when the canvas is modified.
     * Computes the diff between the last known internal state and the new state,
     * then stores that delta.
     */
    private onCanvasModified(): void {
        if (this.isHistoryProcessing || this.isInitializing) {
            return;
        }

        const currentState: HistoryState = this.getCanvasState();
        const currentInternal = this.toInternalState(currentState);

        // 1. Compute the patch (delta) from the last internal state to the current one.
        const patched = diff(this.lastInternalState, currentInternal);
        // 2. If nothing changed, do not record a delta.
        if (!patched) {
            return;
        }
        // 3. Compute the inverse patch (from current back to previous).
        const inversePatch = diff(currentInternal, this.lastInternalState);

        const deltaEntry: DeltaEntry = {
            patched,
            inversePatch,
        };

        // 4. Push the new delta entry onto the undo stack.
        this.undoStack.push(deltaEntry);
        // 5. Clear the redo stack.
        this.redoStack = [];
        // 6. Limit the undo stack size.
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        // 7. Update the last known internal state.
        this.lastInternalState = currentInternal;
        // 8. Update the dirty flag.
        this.isDirty = !this.areStatesEqual(this.lastSavedJson, currentState);
        this.floor.emit("historyChange");
    }

    /**
     * Loads a given HistoryState onto the canvas.
     */
    private async loadState(state: HistoryState): Promise<void> {
        this.isHistoryProcessing = true;

        try {
            await this.floor.importFloor({
                width: state.width,
                height: state.height,
                json: state.json,
            });

            this.floor.requestGridRender();
            await canvasToRender(this.floor.canvas);
        } finally {
            this.isHistoryProcessing = false;
            this.isDirty = !this.areStatesEqual(this.lastSavedJson, state);
            this.floor.emit("historyChange");
        }
    }

    /**
     * Compares two HistoryStates (after normalizing them) to see if they are equal.
     */
    private areStatesEqual(state1: HistoryState, state2: HistoryState): boolean {
        const json1 = JSON.parse(state1.json);
        const json2 = JSON.parse(state2.json);

        const normalized1 = {
            width: state1.width,
            height: state1.height,
            background: json1.background,
            objects: CanvasHistory.normalize(json1.objects),
        };
        const normalized2 = {
            width: state2.width,
            height: state2.height,
            background: json2.background,
            objects: CanvasHistory.normalize(json2.objects),
        };

        return isEqual(normalized1, normalized2);
    }
}
