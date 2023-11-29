import { EventManager } from "./EventManager";
import { RESOLUTION } from "../constants";
import { Floor } from "../Floor";
import { CommandInvoker } from "../command/CommandInvoker";
import { MoveCommand } from "../command/MoveCommand";

export class EditorEventManager extends EventManager {
    ctrlPressedDuringSelection: boolean = false;

    private movingObjectStartPosition: {
        left: number;
        top: number;
    } | null = null;

    constructor(
        floor: Floor,
        private commandInvoker: CommandInvoker,
    ) {
        super(floor);
        this.initializeCanvasEventHandlers();
        this.initializeCtrlEventListeners();
    }

    destroy(): void {
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyUp);
    }

    private initializeCtrlEventListeners(): void {
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyUp);
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key !== "Control" && !e.ctrlKey) {
            return;
        }
        this.floor.canvas.selection = true;
        this.ctrlPressedDuringSelection = true;
        this.floor.canvas.requestRenderAll();

        if (e.key === "z") {
            if (e.shiftKey) {
                this.commandInvoker.redo();
            } else {
                this.commandInvoker.undo();
            }
            this.floor.canvas.requestRenderAll();
            e.preventDefault();
        } else if (e.key === "y") {
            this.commandInvoker.redo();
            this.floor.canvas.requestRenderAll();
            e.preventDefault();
        }
    };

    private handleKeyUp = (e: KeyboardEvent): void => {
        if (e.key === "Control" || e.ctrlKey) {
            this.floor.canvas.selection = false;
            this.floor.canvas.requestRenderAll();
        }
    };

    handleObjectMoving = (options: any): void => {
        if (!this.ctrlPressedDuringSelection) {
            return;
        }
        const activeObjects = this.floor.canvas.getActiveObjects();
        const activeGroup = this.floor.canvas.getActiveObject();

        if (activeGroup && activeGroup.type === "group") {
            activeObjects.forEach((object) => {
                if (object !== activeGroup) {
                    object.set({
                        left: object.left! + options.e.movementX,
                        top: object.top! + options.e.movementY,
                    });
                }
            });
        }

        this.ctrlPressedDuringSelection = false;
    };

    onBeforeTransform = (options: any): void => {
        if (options.transform?.target && !this.movingObjectStartPosition) {
            this.movingObjectStartPosition = {
                left: options.transform.target.left!,
                top: options.transform.target.top!,
            };
        }
    };

    onObjectModified = (options: any): void => {
        if (!this.movingObjectStartPosition || !options.target) {
            return;
        }
        const moveCommand = new MoveCommand(options.target, this.movingObjectStartPosition, {
            left: options.target.left!,
            top: options.target.top!,
        });
        this.commandInvoker.execute(moveCommand);

        // Reset the starting position for the next move operation
        this.movingObjectStartPosition = null;
    };

    initializeCanvasEventHandlers(): void {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("object:modified", this.snapToGridOnModify);
        this.floor.canvas.on("mouse:up", this.onEditorMouseUp);
        this.floor.canvas.on("object:moving", this.handleObjectMoving);
        this.floor.canvas.on("before:transform", this.onBeforeTransform);
        this.floor.canvas.on("object:modified", this.onObjectModified);
    }

    private onEditorMouseUp = (): void => {
        const hasActiveElement = this.floor.canvas.getActiveObject();
        if (!hasActiveElement) {
            this.floor.emit("elementClicked", this.floor, void 0);
        }
    };

    private snapToGridOnModify = (e: any): void => {
        const target = e.target;

        if (!target) {
            return;
        }

        // Snapping logic for rotation
        const snapAngle = 45; // 45 degrees
        const threshold = 5; // degrees
        const closestMultipleOfSnap = Math.round(target.angle! / snapAngle) * snapAngle;
        const differenceFromSnap = Math.abs(target.angle! - closestMultipleOfSnap);
        if (differenceFromSnap <= threshold) {
            target.set("angle", closestMultipleOfSnap).setCoords();
        }

        // Snapping logic for movement
        const snapRange = 2; // pixels

        const leftRemainder = target.left! % RESOLUTION;
        const topRemainder = target.top! % RESOLUTION;

        const shouldSnapToLeft =
            leftRemainder <= snapRange || RESOLUTION - leftRemainder <= snapRange;
        const shouldSnapToTop = topRemainder <= snapRange || RESOLUTION - topRemainder <= snapRange;

        let newLeft: number | undefined;
        let newTop: number | undefined;

        if (shouldSnapToLeft) {
            newLeft =
                leftRemainder <= snapRange
                    ? target.left! - leftRemainder
                    : target.left! + (RESOLUTION - leftRemainder);
        }

        if (shouldSnapToTop) {
            newTop =
                topRemainder <= snapRange
                    ? target.top! - topRemainder
                    : target.top! + (RESOLUTION - topRemainder);
        }

        if (newLeft !== undefined || newTop !== undefined) {
            target
                .set({
                    left: newLeft ?? target.left,
                    top: newTop ?? target.top,
                })
                .setCoords();
        }

        this.floor.canvas.requestRenderAll();
    };
}
