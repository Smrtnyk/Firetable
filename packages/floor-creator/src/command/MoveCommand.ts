import { Command } from "./Command";
import { fabric } from "fabric";

type Position = {
    left: number;
    top: number;
};

export class MoveCommand implements Command {
    private object: fabric.Object;
    private oldPosition: Position;
    private newPosition: Position;

    constructor(object: fabric.Object, oldPosition: Position, newPosition: Position) {
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
