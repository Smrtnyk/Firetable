import { Command } from "./Command";

type EventListener = () => void;

export class CommandInvoker {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private listeners: { [key: string]: EventListener[] } = {};

    execute(command: Command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack.length = 0;
        this.emit("change");
    }

    undo() {
        if (!this.canUndo()) return;
        const command = this.undoStack.pop()!;
        command.undo();
        this.redoStack.push(command);
        this.emit("change");
    }

    redo() {
        if (!this.canRedo()) return;
        const command = this.redoStack.pop()!;
        command.execute();
        this.undoStack.push(command);
        this.emit("change");
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    emit(eventName: string) {
        if (!this.listeners[eventName]) return; // If no listeners for this event, exit
        this.listeners[eventName].forEach((listener) => {
            listener(); // Call each registered listener
        });
    }

    on(eventName: string, listener: EventListener) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(listener);
        return () => {
            this.listeners[eventName] = this.listeners[eventName].filter((l) => l !== listener);
        };
    }
}
