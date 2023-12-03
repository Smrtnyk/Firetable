import type { SpyInstance } from "vitest";
import { EditorEventManager } from "./EditorEventManager";
import { RESOLUTION } from "../constants";
import { CommandInvoker } from "../command/CommandInvoker";
import { FloorEditor } from "../FloorEditor";
import { expect, it, describe, beforeEach, vi } from "vitest";
import { FabricObject, Group } from "fabric";

describe("EditorEventManager", () => {
    let manager: EditorEventManager;
    let commandInvoker: CommandInvoker;
    let floor: FloorEditor;
    let canvasOnEventSpy: SpyInstance<Parameters<typeof floor.canvas.on>>;

    beforeEach(() => {
        commandInvoker = new CommandInvoker();
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        floor = new FloorEditor({
            canvas,
            floorDoc: {
                id: "test-id",
                name: "test floor",
                width: 1000,
                height: 1000,
                json: {},
                propertyId: "",
            },
            containerWidth: 1000,
        });

        canvasOnEventSpy = vi.spyOn(floor.canvas, "on");

        manager = new EditorEventManager(floor, commandInvoker);
        manager.initializeCanvasEventHandlers();
    });

    describe("EditorEventManager - Object Movement Snapping", () => {
        it("should snap object angle to the closest multiple of snap angle", () => {
            const mockEvent = {} as any;
            const target = new FabricObject();
            mockEvent.target = target;
            target.angle = 47;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(target.angle).toBe(45);
        });

        it("should snap object to the left when within snap range on the left", () => {
            const mockEvent = {} as any;
            const target = new FabricObject();
            mockEvent.target = target;
            target.left = RESOLUTION - 1;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(target.left).toBe(15);
        });

        it("should snap object to the top when within snap range at the top", () => {
            const mockEvent = {} as any;
            const target = new FabricObject();
            mockEvent.target = target;
            target.top = RESOLUTION - 1; // 14

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(target.top).toBe(RESOLUTION);
        });

        it("should snap object to both left and top when within snap range on both axes", () => {
            const mockEvent = {} as any;
            const target = new FabricObject();
            mockEvent.target = target;
            target.left = RESOLUTION - 1;
            target.top = RESOLUTION - 1;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(target.top).toBe(RESOLUTION);
            expect(target.left).toBe(RESOLUTION);
        });

        it("should not snap object if it's outside the snap range", () => {
            const mockEvent = {} as any;
            const target = new FabricObject();
            mockEvent.target = target;
            target.left = RESOLUTION - 3; // Outside the snap range

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(target.top).toBe(0);
            expect(target.left).toBe(12);
        });
    });

    describe("EditorEventManager - Event Registration", () => {
        it("should register the necessary events on initialization", () => {
            expect(canvasOnEventSpy).toHaveBeenCalledWith(
                "object:modified",
                // @ts-expect-error -- private method
                manager.snapToGridOnModify,
            );

            expect(canvasOnEventSpy).toHaveBeenCalledWith(
                "mouse:up",
                // @ts-expect-error -- private method
                manager.onEditorMouseUp,
            );
        });
    });

    describe("EditorEventManager - Mouse Up Event Handling", () => {
        it("should call elementClickHandler when there is no active object on canvas", () => {
            vi.spyOn(floor.canvas, "getActiveObject").mockReturnValue(void 0);
            const emitSpy = vi.spyOn(floor, "emit");

            // @ts-expect-error -- private method
            manager.onEditorMouseUp();

            expect(emitSpy).toHaveBeenCalledWith(
                "elementClicked",
                // @ts-expect-error -- private property
                manager.floor,
                void 0,
            );
        });
    });

    describe("EditorEventManager - Keyboard Event Handling", () => {
        it("should enable canvas selection when Control key is pressed", () => {
            const mockEvent = new KeyboardEvent("keydown", { key: "Control" });
            // @ts-expect-error -- private method invocation
            manager.handleKeyDown(mockEvent);
            // @ts-expect-error -- accessing private property
            expect(manager.floor.canvas.selection).toBe(true);
        });

        it("should disable canvas selection when Control key is released", () => {
            const mockEvent = new KeyboardEvent("keyup", { key: "Control" });
            // @ts-expect-error -- private method invocation
            manager.handleKeyUp(mockEvent);
            // @ts-expect-error -- accessing private property
            expect(manager.floor.canvas.selection).toBe(false);
        });

        it("should trigger undo when 'z' is pressed with Control key", () => {
            const spyUndo = vi.spyOn(commandInvoker, "undo");
            const mockEvent = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
            // @ts-expect-error -- private method invocation
            manager.handleKeyDown(mockEvent);
            expect(spyUndo).toHaveBeenCalled();
        });

        it("should trigger redo when 'y' is pressed with Control key", () => {
            const spyRedo = vi.spyOn(commandInvoker, "redo");
            const mockEvent = new KeyboardEvent("keydown", { key: "y", ctrlKey: true });
            // @ts-expect-error -- private method invocation
            manager.handleKeyDown(mockEvent);
            expect(spyRedo).toHaveBeenCalled();
        });

        it("should trigger redo when 'z' is pressed with Control and Shift keys", () => {
            const spyRedo = vi.spyOn(commandInvoker, "redo");
            const mockEvent = new KeyboardEvent("keydown", {
                key: "z",
                ctrlKey: true,
                shiftKey: true,
            });
            // @ts-expect-error -- private method invocation
            manager.handleKeyDown(mockEvent);
            expect(spyRedo).toHaveBeenCalled();
        });
    });

    describe("EditorEventManager - Object Movement with Control Key", () => {
        it("should move all active objects when Control key is pressed during object movement", () => {
            const activeObject = new FabricObject();
            const mockGroup = new Group();
            vi.spyOn(floor.canvas, "getActiveObjects").mockReturnValue([activeObject]);
            vi.spyOn(floor.canvas, "getActiveObject").mockReturnValue(mockGroup);
            const setSpy = vi.spyOn(activeObject, "set");

            const mockEvent = {
                e: { movementX: 5, movementY: 10 },
            } as any;
            // Simulate Control key being pressed
            manager.ctrlPressedDuringSelection = true;

            manager.handleObjectMoving(mockEvent);

            // Now we need to test if 'set' was called with the correct arguments
            expect(setSpy).toHaveBeenCalledWith({
                left: expect.any(Number),
                top: expect.any(Number),
            });

            expect(activeObject.left).toBe(5);
            expect(activeObject.top).toBe(10);
        });
    });

    describe("EditorEventManager - Destroy Method", () => {
        it("should remove all event listeners when destroy is called", () => {
            const relSpy = vi.spyOn(document, "removeEventListener");
            // Call the destroy method
            manager.destroy();

            // Check if removeEventListener has been called for each event
            expect(relSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
            expect(relSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
        });
    });
});
