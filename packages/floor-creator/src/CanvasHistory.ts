import type { FabricObject } from "fabric";

import { cloneDeep, isEqual, Mutex, once } from "es-toolkit";
import { diff, patch } from "jsondiffpatch";

import type { FloorEditor } from "./FloorEditor.js";

import { canvasToRender } from "./utils.js";

interface CanvasHistoryOptions {
    maxStackSize?: number;
}

interface DeltaEntry {
    /**
     * computed as: diff(currentInternalState, lastInternalState)
     */
    inversePatch: any;
    /**
     * computed as: diff(lastInternalState, currentInternalState)
     */
    patched: any;
}

interface HistoryState {
    height: number;
    json: string;
    width: number;
}

interface InternalState {
    /**
     * parsed canvas state
     */
    canvas: Record<string, unknown>;
    height: number;
    width: number;
}

interface NormalizedCanvasObject {
    angle: number;
    fill: FabricObject["fill"];
    height: number;
    left: number;
    objects?: NormalizedCanvasObject[];
    scaleX: number;
    scaleY: number;
    stroke: FabricObject["stroke"];
    top: number;
    width: number;
}

const DEFAULT_MAX_STACK_SIZE = 50;

export class CanvasHistory {
    private isInitializing: boolean;

    /**
     * The last known internal state (used for computing deltas)
     */
    private lastInternalState: InternalState;
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
    private readonly floor: FloorEditor;
    private readonly handlers: {
        "object:added": () => void;
        "object:modified": () => void;
        "object:removed": () => void;
    };
    private isDirty: boolean;
    /**
     * This flag prevents history recordings while an undo/redo is in progress.
     */
    private isHistoryProcessing: boolean;
    private lastSavedJson: HistoryState;
    private readonly maxStackSize: number;
    private readonly mutex = new Mutex();
    private redoStack: DeltaEntry[];
    private undoStack: DeltaEntry[];

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
            "object:added": this.onCanvasModified.bind(this),
            "object:modified": this.onCanvasModified.bind(this),
            "object:removed": this.onCanvasModified.bind(this),
        };
    }

    static normalize(canvasObjects: FabricObject[]): NormalizedCanvasObject[] {
        return canvasObjects.map(function (obj) {
            const { angle, fill, height, left, scaleX, scaleY, stroke, top, width } = obj;

            if ("objects" in obj) {
                return {
                    angle,
                    fill,
                    height,
                    left,
                    objects: CanvasHistory.normalize(obj["objects"] as FabricObject[]),
                    scaleX,
                    scaleY,
                    stroke,
                    top,
                    width,
                };
            }
            return { angle, fill, height, left, scaleX, scaleY, stroke, top, width };
        });
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    canUndo(): boolean {
        // If there’s at least one delta recorded, we can undo.
        return this.undoStack.length > 0;
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.floor.emit("historyChange");
    }

    destroy(): void {
        this.detachEventListeners();
        this.clear();
    }

    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }

    /**
     * Marks the current state as saved (e.g. after a save operation).
     */
    markAsSaved(): void {
        this.lastSavedJson = this.getCanvasState();
        this.isDirty = false;
        this.floor.emit("historyChange");
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

    /**
     * Compares two HistoryStates (after normalizing them) to see if they are equal.
     */
    private areStatesEqual(state1: HistoryState, state2: HistoryState): boolean {
        const json1 = JSON.parse(state1.json);
        const json2 = JSON.parse(state2.json);

        const normalized1 = {
            background: json1.background,
            height: state1.height,
            objects: CanvasHistory.normalize(json1.objects),
            width: state1.width,
        };
        const normalized2 = {
            background: json2.background,
            height: state2.height,
            objects: CanvasHistory.normalize(json2.objects),
            width: state2.width,
        };

        return isEqual(normalized1, normalized2);
    }

    private attachEventListeners(): void {
        this.floor.canvas.on(this.handlers);
    }

    private detachEventListeners(): void {
        this.floor.canvas.off(this.handlers);
    }

    /**
     * Converts an InternalState back to a HistoryState.
     */
    private fromInternalState(internal: InternalState): HistoryState {
        return {
            height: internal.height,
            json: JSON.stringify(internal.canvas),
            width: internal.width,
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

    /**
     * Loads a given HistoryState onto the canvas.
     */
    private async loadState(state: HistoryState): Promise<void> {
        this.isHistoryProcessing = true;

        try {
            await this.floor.importFloor({
                height: state.height,
                json: state.json,
                width: state.width,
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
            inversePatch,
            patched,
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
     * Converts a HistoryState (which contains a JSON string) into an InternalState
     * that we can diff.
     */
    private toInternalState(state: HistoryState): InternalState {
        return {
            canvas: JSON.parse(state.json),
            height: state.height,
            width: state.width,
        };
    }
}
