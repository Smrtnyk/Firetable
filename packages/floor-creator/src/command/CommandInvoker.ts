import { Command } from "./Command";

export class CommandInvoker {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    execute(command: Command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack when a new command is executed
    }

    undo() {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }
}
