import type { FloorEditor } from "./FloorEditor.js";
import type { FabricObject, TFiller } from "fabric";
import { EventEmitter } from "@posva/event-emitter";
import { delay, isEqual, once } from "es-toolkit";

interface HistoryState {
    width: number;
    height: number;
    json: string;
    timestamp: number;
}

interface CanvasHistoryOptions {
    maxStackSize?: number;
}

type HistoryEvents = {
    stateChange: [];
};

interface NormalizedCanvasObject {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    fill: TFiller | string | null;
    stroke: TFiller | string | null;
    objects?: NormalizedCanvasObject[];
}

export class CanvasHistory extends EventEmitter<HistoryEvents> {
    initialize = once((): void => {
        // Save initial state without triggering events
        const initialState: HistoryState = {
            ...this.floor.export(),
            timestamp: Date.now(),
        };
        this.undoStack = [initialState];

        this.attachEventListeners();
        this.isInitializing = false;
        this.markAsSaved();
    });

    private readonly floor: FloorEditor;
    private readonly maxStackSize: number;
    private lastSavedJson: string;
    private isDirty: boolean;
    private undoStack: HistoryState[];
    private redoStack: HistoryState[];
    private isHistoryProcessing: boolean;
    private isInitializing: boolean;
    private readonly handlers: {
        "object:modified": () => void;
        "object:added": () => void;
        "object:removed": () => void;
    };

    constructor(floor: FloorEditor, options: CanvasHistoryOptions = {}) {
        super();
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
        this.emit("stateChange");
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

    async undo(): Promise<void> {
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

        const previousState = this.undoStack[this.undoStack.length - 1];

        await this.loadState(previousState);
    }

    async redo(): Promise<void> {
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
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.emit("stateChange");
    }

    private getCanvasState(): string {
        const json = this.floor.canvas.toDatalessJSON([
            "label",
            "name",
            "type",
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
        ]);
        return JSON.stringify(json);
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

        const currentJson = this.getCanvasState();
        const lastState = this.undoStack[this.undoStack.length - 1];

        if (lastState && this.areStatesEqual(lastState.json, currentJson)) {
            // Don't save if nothing has changed
            return;
        }

        this.saveState(currentJson);
    }

    private saveState(currentJson: string): void {
        const state: HistoryState = {
            width: this.floor.width,
            height: this.floor.height,
            json: currentJson,
            timestamp: Date.now(),
        };

        this.undoStack.push(state);
        this.redoStack = [];

        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this.isDirty = !this.areStatesEqual(this.lastSavedJson, currentJson);
        this.emit("stateChange");
    }

    private async loadState(state: HistoryState): Promise<void> {
        this.isHistoryProcessing = true;

        try {
            await this.floor.importFloor(
                {
                    width: state.width,
                    height: state.height,
                    json: state.json,
                },
                true,
            );

            this.floor.renderGrid();

            // Wait for the canvas to finish rendering
            await new Promise<unknown>((resolve) => {
                this.floor.canvas.requestRenderAll();
                this.floor.canvas.once("after:render", resolve);
            });

            // Additional wait to ensure all object events have fired
            await delay(0);
        } finally {
            this.isHistoryProcessing = false;
            this.isDirty = !this.areStatesEqual(this.lastSavedJson, state.json);
            this.emit("stateChange");
        }
    }

    private areStatesEqual(json1: string, json2: string): boolean {
        const obj1 = JSON.parse(json1);
        const obj2 = JSON.parse(json2);

        const normalized1 = {
            background: obj1.background,
            objects: CanvasHistory.normalize(obj1.objects),
        };
        const normalized2 = {
            background: obj2.background,
            objects: CanvasHistory.normalize(obj2.objects),
        };

        return isEqual(normalized1, normalized2);
    }
}
