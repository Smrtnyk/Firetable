import { Floor } from "./Floor";
import { fabric } from "fabric";
import {
    CreateElementOptions,
    FloorEditorCreationOptions,
    FloorEditorDoubleClickHandler,
    FloorEditorElement,
} from "./types";
import { EventManager } from "./event-manager/EventManager";
import { ElementManager } from "./ElementManager";
import { FloorDoc } from "@firetable/types";
import { GridDrawer } from "./GridDrawer";
import { EditorEventManager } from "./event-manager/EditorEventManager";
import { calculateCanvasScale } from "./utils";
import { CommandInvoker } from "./command/CommandInvoker";
import { MoveCommand } from "./command/MoveCommand";

export class FloorEditor extends Floor {
    protected eventManager: EventManager;
    private elementManager: ElementManager;
    private gridDrawer: GridDrawer;
    commandInvoker = new CommandInvoker();

    private readonly dblClickHandler?: FloorEditorDoubleClickHandler;

    private ctrlPressedDuringSelection: boolean = false;

    private movingObjectStartPosition: { left: number; top: number } | null = null;

    constructor(options: FloorEditorCreationOptions) {
        super(options);

        this.dblClickHandler = options.dblClickHandler;
        this.gridDrawer = new GridDrawer(this.canvas);
        this.eventManager = new EditorEventManager(this);
        this.elementManager = new ElementManager();
        this.initializeCanvasEventHandlers();
        this.initializeCtrlEventListeners();
        this.canvas.on("object:moving", (options) => {
            if (this.ctrlPressedDuringSelection) {
                const activeObjects = this.canvas.getActiveObjects();
                const activeGroup = this.canvas.getActiveObject() as fabric.Group;

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
            }
        });

        this.canvas.on("before:transform", (options) => {
            if (options.transform && options.transform.target && !this.movingObjectStartPosition) {
                this.movingObjectStartPosition = {
                    left: options.transform.target.left!,
                    top: options.transform.target.top!,
                };
            }
        });

        this.canvas.on("object:modified", (options) => {
            if (this.movingObjectStartPosition && options.target) {
                const moveCommand = new MoveCommand(
                    options.target,
                    this.movingObjectStartPosition,
                    { left: options.target.left!, top: options.target.top! },
                );
                this.commandInvoker.execute(moveCommand);

                // Reset the starting position for the next move operation
                this.movingObjectStartPosition = null;
            }
        });

        this.renderGrid();
    }

    private initializeCtrlEventListeners() {
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyUp);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Control" || e.ctrlKey) {
            this.canvas.selection = true;
            this.ctrlPressedDuringSelection = true;
            this.canvas.renderAll();

            if (e.key === "z") {
                if (e.shiftKey) {
                    this.commandInvoker.redo();
                } else {
                    this.commandInvoker.undo();
                }
                this.canvas.renderAll();
                e.preventDefault();
            } else if (e.key === "y") {
                this.commandInvoker.redo();
                this.canvas.renderAll();
                e.preventDefault();
            }
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Control" || e.ctrlKey) {
            this.canvas.selection = false;
            this.canvas.renderAll();
        }
    };

    onFloorDoubleTap(coordinates: [x: number, y: number]) {
        this.dblClickHandler?.(this, coordinates);
    }

    protected onElementClick = (ev: fabric.IEvent<MouseEvent>) => {
        this.elementClickHandler(this, ev.target as FloorEditorElement);
    };

    renderGrid() {
        this.gridDrawer.drawGrid(this.width, this.height);
    }

    renderData(jsonData?: FloorDoc["json"]) {
        super.renderData(jsonData);
    }

    initializeCanvasEventHandlers() {
        this.eventManager?.initializeCanvasEventHandlers();
    }

    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = false;
        element.lockScalingY = false;
        element.lockMovementX = false;
        element.lockMovementY = false;
        element.lockScalingFlip = true;
    }

    addElement(options: CreateElementOptions) {
        const element = this.elementManager.addElement(options);
        element.on("mouseup", this.onElementClick);
        this.setElementProperties(element);
        this.canvas.add(element);
    }

    toggleGridVisibility = () => {
        this.gridDrawer.toggleGridVisibility(this.width, this.height);
    };

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.scale = calculateCanvasScale(this.containerWidth, this.width);
        this.setScaling();
        this.renderData(this.floorDoc.json);
        this.renderGrid();
    }

    setFloorName(newName: string) {
        this.name = newName;
    }

    destroy() {
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyUp);
    }
}
