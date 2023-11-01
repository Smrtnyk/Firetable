import { Command } from "./Command";

type EventListener = () => void;
type CommandInvokerEvent = "change";

export class CommandInvoker {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private listeners = new Map<CommandInvokerEvent, EventListener[]>();

    execute(command: Command): void {
        command.execute();
        this.undoStack.push(command);
        this.redoStack.splice(0, this.redoStack.length);
        this.emit("change");
    }

    undo(): void {
        if (!this.canUndo()) return;
        const command = this.undoStack.pop()!;
        command.undo();
        this.redoStack.push(command);
        this.emit("change");
    }

    redo(): void {
        if (!this.canRedo()) return;
        const command = this.redoStack.pop()!;
        command.execute();
        this.undoStack.push(command);
        this.emit("change");
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

    private emit(eventName: CommandInvokerEvent): void {
        const listenersForEvent = this.listeners.get(eventName);
        if (!listenersForEvent) return;
        listenersForEvent.forEach((listener) => listener());
    }

    on(eventName: CommandInvokerEvent, listener: EventListener): () => void {
        let listenersForEvent = this.listeners.get(eventName);
        if (!listenersForEvent) {
            listenersForEvent = [];
            this.listeners.set(eventName, listenersForEvent);
        }
        listenersForEvent.push(listener);
        return () => {
            if (!listenersForEvent) {
                return;
            }
            this.listeners.set(
                eventName,
                listenersForEvent.filter((l) => l !== listener),
            );
        };
    }
}
