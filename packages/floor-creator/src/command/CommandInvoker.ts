import type { Command } from "./Command.js";
import { EventEmitter } from "../event-emitter/EventEmitter.js";

type CommandInvokerEvents = {
    change: [null];
};

export class CommandInvoker extends EventEmitter<CommandInvokerEvents> {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    public execute(command: Command): void {
        command.execute();
        this.updateStacksForExecute(command);
        this.emitChange();
    }

    public undo(): void {
        this.moveBetweenStacks(this.undoStack, this.redoStack, "undo");
        this.emitChange();
    }

    public redo(): void {
        this.moveBetweenStacks(this.redoStack, this.undoStack, "execute");
        this.emitChange();
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.emitChange();
    }

    private updateStacksForExecute(command: Command): void {
        this.undoStack.push(command);
        // Clear the redo stack whenever a new command is executed
        this.redoStack = [];
    }

    private moveBetweenStacks(
        sourceStack: Command[],
        targetStack: Command[],
        action: "execute" | "undo",
    ): void {
        const command = sourceStack.pop();
        if (!command) {
            return;
        }

        command[action]();
        targetStack.push(command);
    }

    private emitChange(): void {
        this.emit("change", null);
    }
}
