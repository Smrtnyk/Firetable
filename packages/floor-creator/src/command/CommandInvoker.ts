import { Command } from "./Command";
import { EventEmitter } from "../event-emitter/EventEmitter";

type CommandInvokerEvents = {
    change: [null];
};

export class CommandInvoker extends EventEmitter<CommandInvokerEvents> {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    execute(command: Command): void {
        command.execute();
        this.undoStack.push(command);
        this.redoStack.splice(0, this.redoStack.length);
        this.emit("change", null);
    }

    undo(): void {
        if (!this.canUndo()) return;
        const command = this.undoStack.pop()!;
        command.undo();
        this.redoStack.push(command);
        this.emit("change", null);
    }

    redo(): void {
        if (!this.canRedo()) return;
        const command = this.redoStack.pop()!;
        command.execute();
        this.undoStack.push(command);
        this.emit("change", null);
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}
