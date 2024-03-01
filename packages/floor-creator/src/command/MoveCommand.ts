import type { Command } from "./Command.js";
import type { FabricObject } from "fabric/es";

type Position = {
    left: number;
    top: number;
};

export class MoveCommand implements Command {
    private object: FabricObject;
    private oldPosition: Position;
    private newPosition: Position;

    constructor(object: FabricObject, oldPosition: Position, newPosition: Position) {
        this.object = object;
        this.oldPosition = oldPosition;
        this.newPosition = newPosition;
    }

    execute(): void {
        this.object.set(this.newPosition).setCoords();
    }

    undo(): void {
        this.object.set(this.oldPosition).setCoords();
    }
}
