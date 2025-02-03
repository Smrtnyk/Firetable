import type { BasicTransformEvent, FabricObject, ModifiedEvent, TEvent, Transform } from "fabric";

import type { CanvasHistory } from "../CanvasHistory.js";
import type { Floor } from "../Floor.js";

import { RESOLUTION } from "../constants.js";
import { EventManager } from "./EventManager.js";

export class EditorEventManager extends EventManager {
    ctrlPressedDuringSelection = false;

    private movingObjectStartPosition: null | {
        left: number;
        top: number;
    } = null;

    constructor(
        floor: Floor,
        private readonly history: CanvasHistory,
    ) {
        super(floor);
        this.initializeCanvasEventHandlers();
        this.initializeCtrlEventListeners();
    }

    destroy(): void {
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyUp);
    }

    handleObjectMoving = (
        options: BasicTransformEvent<MouseEvent> & { target: FabricObject },
    ): void => {
        if (!this.ctrlPressedDuringSelection) {
            return;
        }
        const activeObjects = this.floor.canvas.getActiveObjects();
        const activeGroup = this.floor.canvas.getActiveObject();

        if (activeGroup && activeGroup.type === "group") {
            activeObjects.forEach((object) => {
                if (object !== activeGroup) {
                    object.set({
                        left: object.left + options.e.movementX,
                        top: object.top + options.e.movementY,
                    });
                }
            });
        }

        this.ctrlPressedDuringSelection = false;
    };

    override initializeCanvasEventHandlers(): void {
        super.initializeCanvasEventHandlers();

        this.floor.canvas.on("object:modified", this.snapToGridOnModify);
        this.floor.canvas.on("mouse:up", this.onEditorMouseUp);
        this.floor.canvas.on("object:moving", this.handleObjectMoving);
        this.floor.canvas.on("before:transform", this.onBeforeTransform);
        this.floor.canvas.on("object:modified", this.onObjectModified);
        this.floor.canvas.wrapperEl.addEventListener("dragover", (e) => e.preventDefault());
        this.floor.canvas.wrapperEl.addEventListener("drop", (e) => {
            e.preventDefault();
            const { x, y } = this.floor.canvas.getScenePoint(e);
            this.floor.emit("drop", this.floor, {
                data: e.dataTransfer?.getData("text/plain"),
                x,
                y,
            });
        });

        this.floor.canvas.on("object:moving", this.enforceObjectBoundaries);
    }

    onBeforeTransform = (options: TEvent & { transform: Transform }): void => {
        if (options.transform?.target && !this.movingObjectStartPosition) {
            this.movingObjectStartPosition = {
                left: options.transform.target.left,
                top: options.transform.target.top,
            };
        }
    };

    onObjectModified = (options: ModifiedEvent): void => {
        if (!this.movingObjectStartPosition || !options.target) {
            return;
        }

        // Reset the starting position for the next move operation
        this.movingObjectStartPosition = null;
    };

    private readonly enforceObjectBoundaries = (
        e: BasicTransformEvent<MouseEvent> & { target: FabricObject },
    ): void => {
        const obj = e.target;
        if (!obj) {
            return;
        }

        // Get the current zoom level and viewport transform
        const zoom = this.floor.canvas.getZoom();
        const vpt = this.floor.canvas.viewportTransform;
        if (!vpt) {
            return;
        }

        // Get object bounds including rotation
        const objBounds = obj.getBoundingRect();

        // Calculate proposed movement
        const movementX = e.e.movementX / zoom;
        const movementY = e.e.movementY / zoom;

        // Calculate proposed new position for the bounds
        let newBoundsLeft = objBounds.left + movementX;
        let newBoundsTop = objBounds.top + movementY;

        // Enforce boundaries considering the entire bounding box
        if (newBoundsLeft < 0) {
            newBoundsLeft = 0;
        } else if (newBoundsLeft + objBounds.width > this.floor.width) {
            newBoundsLeft = this.floor.width - objBounds.width;
        }

        if (newBoundsTop < 0) {
            newBoundsTop = 0;
        } else if (newBoundsTop + objBounds.height > this.floor.height) {
            newBoundsTop = this.floor.height - objBounds.height;
        }

        // Calculate the offset from bounds to object position
        const offsetLeft = objBounds.left - obj.left;
        const offsetTop = objBounds.top - obj.top;

        obj.set({
            left: newBoundsLeft - offsetLeft,
            top: newBoundsTop - offsetTop,
        });

        obj.setCoords();
        this.floor.canvas.requestRenderAll();

        // Prevent default to maintain control
        e.e.preventDefault();
    };

    private readonly handleKeyDown = (e: KeyboardEvent): void => {
        if (!(e.ctrlKey || e.metaKey)) {
            return;
        }
        this.floor.canvas.selection = true;
        this.ctrlPressedDuringSelection = true;
        this.floor.canvas.requestRenderAll();

        if (e.key === "z") {
            this.history.undo();
            e.preventDefault();
        } else if (e.key === "y") {
            this.history.redo();
            e.preventDefault();
        }
    };

    private readonly handleKeyUp = (e: KeyboardEvent): void => {
        if (e.key === "Control" || e.key === "Meta") {
            this.floor.canvas.selection = false;
            this.floor.canvas.requestRenderAll();
        }
    };

    private initializeCtrlEventListeners(): void {
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyUp);
    }

    private readonly onEditorMouseUp = (): void => {
        const hasActiveElement = this.floor.canvas.getActiveObject();
        if (!hasActiveElement) {
            this.floor.emit("elementClicked", this.floor, void 0);
        }
    };

    private readonly snapToGridOnModify = (e: ModifiedEvent): void => {
        const target = e.target;

        if (!target) {
            return;
        }

        // Snapping logic for rotation
        // In degrees
        const snapAngle = 45;
        // In degrees
        const threshold = 5;
        const closestMultipleOfSnap = Math.round(target.angle / snapAngle) * snapAngle;
        const differenceFromSnap = Math.abs(target.angle - closestMultipleOfSnap);
        if (differenceFromSnap <= threshold) {
            target.set("angle", closestMultipleOfSnap).setCoords();
        }

        // Snapping logic for movement in pixels
        const snapRange = 2;

        const leftRemainder = target.left % RESOLUTION;
        const topRemainder = target.top % RESOLUTION;

        const shouldSnapToLeft =
            leftRemainder <= snapRange || RESOLUTION - leftRemainder <= snapRange;
        const shouldSnapToTop = topRemainder <= snapRange || RESOLUTION - topRemainder <= snapRange;

        let newLeft: number | undefined;
        let newTop: number | undefined;

        if (shouldSnapToLeft) {
            newLeft =
                leftRemainder <= snapRange
                    ? target.left - leftRemainder
                    : target.left + (RESOLUTION - leftRemainder);
        }

        if (shouldSnapToTop) {
            newTop =
                topRemainder <= snapRange
                    ? target.top - topRemainder
                    : target.top + (RESOLUTION - topRemainder);
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
