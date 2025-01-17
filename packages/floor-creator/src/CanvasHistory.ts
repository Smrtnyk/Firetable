import type { FloorEditor } from "./FloorEditor.js";
import type { FabricObject } from "fabric";
import { canvasToRender } from "./utils.js";
import { delay, isEqual, once } from "es-toolkit";
import { Mutex } from "async-mutex";

interface HistoryState {
    width: number;
    height: number;
    json: string;
    timestamp: number;
}

interface CanvasHistoryOptions {
    maxStackSize?: number;
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

export class CanvasHistory {
    initialize = once((): void => {
        // Save initial state without triggering events
        const initialState: HistoryState = this.getCanvasState();
        this.undoStack = [initialState];

        this.attachEventListeners();
        this.isInitializing = false;
        this.markAsSaved();
    });

    private readonly mutex = new Mutex();
    private readonly floor: FloorEditor;
    private readonly maxStackSize: number;
    private lastSavedJson: HistoryState;
    private isDirty: boolean;
    private undoStack: HistoryState[];
    private redoStack: HistoryState[];
    // This flag is used to prevent new history entries from being added while
    // undo or redo is in progress (e.g., to avoid infinite loops of state changes).
    private isHistoryProcessing: boolean;
    private isInitializing: boolean;
    private readonly handlers: {
        "object:modified": () => void;
        "object:added": () => void;
        "object:removed": () => void;
    };

    constructor(floor: FloorEditor, options: CanvasHistoryOptions = {}) {
        this.floor = floor;
        this.maxStackSize = options.maxStackSize ?? 20;
        this.undoStack = [];
        this.redoStack = [];
        this.isHistoryProcessing = false;
        this.isInitializing = true;
        this.lastSavedJson = this.getCanvasState();
        this.isDirty = false;

        this.handlers = {
            "object:modified": this.onCanvasModified.bind(this),
            "object:added": this.onCanvasModified.bind(this),
            "object:removed": this.onCanvasModified.bind(this),
        };
    }

    static normalize(canvasObjects: FabricObject[]): NormalizedCanvasObject[] {
        return canvasObjects.map((obj) => {
            const { left, top, width, height, scaleX, scaleY, angle, fill, stroke, type } = obj;

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
                    type,
                    objects: CanvasHistory.normalize(obj["objects"] as FabricObject[]),
                };
            }
            return { left, top, width, height, scaleX, scaleY, angle, fill, stroke, type };
        });
    }

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
        return this.undoStack.length > 1;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    undo(): Promise<void> {
        return this.mutex.runExclusive(async () => {
            if (!this.canUndo()) {
                return;
            }

            const currentState = this.undoStack.pop();
            if (!currentState) {
                return;
            }

            this.redoStack.push(currentState);
            if (this.redoStack.length > this.maxStackSize) {
                this.redoStack.shift();
            }

            const previousState = this.undoStack.at(-1);
            if (!previousState) {
                return;
            }

            await this.loadState(previousState);
        });
    }

    redo(): Promise<void> {
        return this.mutex.runExclusive(async () => {
            if (!this.canRedo()) {
                return;
            }

            const nextState = this.redoStack.pop();
            if (!nextState) {
                return;
            }

            this.undoStack.push(nextState);
            if (this.undoStack.length > this.maxStackSize) {
                this.undoStack.shift();
            }

            await this.loadState(nextState);
        });
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.floor.emit("historyChange");
    }

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
            timestamp: Date.now(),
        };
    }

    private attachEventListeners(): void {
        this.floor.canvas.on(this.handlers);
    }

    private detachEventListeners(): void {
        this.floor.canvas.off(this.handlers);
    }

    private onCanvasModified(): void {
        if (this.isHistoryProcessing || this.isInitializing) {
            return;
        }

        const currentState: HistoryState = this.getCanvasState();
        const lastState = this.undoStack.at(-1);

        if (lastState && this.areStatesEqual(lastState, currentState)) {
            // Don't save if nothing has changed
            return;
        }

        this.saveState(currentState);
    }

    private saveState(currentJson: HistoryState): void {
        this.undoStack.push(currentJson);
        this.redoStack = [];

        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this.isDirty = !this.areStatesEqual(this.lastSavedJson, currentJson);
        this.floor.emit("historyChange");
    }

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
            // Additional wait to ensure all object events have fired
            await delay(0);
        } finally {
            this.isHistoryProcessing = false;
            this.isDirty = !this.areStatesEqual(this.lastSavedJson, state);
            this.floor.emit("historyChange");
        }
    }

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
