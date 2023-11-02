vi.mock("fabric");

import { Floor } from "../Floor";
import { EditorEventManager } from "./EditorEventManager";
import { fabric } from "fabric";
import { RESOLUTION } from "../constants";
import { CommandInvoker } from "../command/CommandInvoker";
import { expect, it, describe, beforeEach, vi } from "vitest";

describe("EditorEventManager", () => {
    let manager: EditorEventManager;
    let mockTarget: fabric.Object;
    let commandInvoker: CommandInvoker;

    beforeEach(() => {
        commandInvoker = new CommandInvoker();
        // @ts-expect-error -- stubbing Keyboard event
        global.KeyboardEvent = vi.fn().mockImplementation((type, config) => {
            return {
                ...config,
                type,
                preventDefault: vi.fn(),
            };
        });
        // @ts-expect-error -- stubbing document object
        globalThis.document = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        // Mocking canvas and other related methods
        const mockCanvas = {
            on: vi.fn(),
            getActiveObject: vi.fn(),
            renderAll: vi.fn(),
        } as unknown as fabric.Canvas;

        const mockFloor = {
            canvas: mockCanvas,
            elementClickHandler: vi.fn(),
            emit: vi.fn(),
        } as unknown as Floor;

        mockTarget = {
            set: vi.fn().mockReturnThis(),
            setCoords: vi.fn(),
        } as unknown as fabric.Object;

        manager = new EditorEventManager(mockFloor, commandInvoker);
        manager.initializeCanvasEventHandlers();
    });

    describe("EditorEventManager - Object Movement Snapping", () => {
        it("should snap object angle to the closest multiple of snap angle", () => {
            const mockEvent = {} as fabric.IEvent;
            mockEvent.target = mockTarget;
            mockTarget.angle = 47;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(mockTarget.set).toHaveBeenCalledWith("angle", 45);
        });

        it("should snap object to the left when within snap range on the left", () => {
            const mockEvent = {} as fabric.IEvent;
            mockEvent.target = mockTarget;
            mockTarget.left = RESOLUTION - 1;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(mockTarget.set).toHaveBeenCalledWith({ left: 15, top: mockTarget.top });
        });

        it("should snap object to the top when within snap range at the top", () => {
            const mockEvent = {} as fabric.IEvent;
            mockEvent.target = mockTarget;
            mockTarget.top = RESOLUTION - 1; // 14

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(mockTarget.set).toHaveBeenCalledWith({ top: RESOLUTION, left: mockTarget.left });
        });

        it("should snap object to both left and top when within snap range on both axes", () => {
            const mockEvent = {} as fabric.IEvent;
            mockEvent.target = mockTarget;
            mockTarget.left = RESOLUTION - 1;
            mockTarget.top = RESOLUTION - 1;

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(mockTarget.set).toHaveBeenCalledWith({ left: RESOLUTION, top: RESOLUTION });
        });

        it("should not snap object if it's outside the snap range", () => {
            const mockEvent = {} as fabric.IEvent;
            mockEvent.target = mockTarget;
            mockTarget.left = RESOLUTION - 3; // Outside the snap range

            // @ts-expect-error -- private method
            manager.snapToGridOnModify(mockEvent);

            expect(mockTarget.set).not.toHaveBeenCalled();
        });
    });

    describe("EditorEventManager - Event Registration", () => {
        it("should register the necessary events on initialization", () => {
            // @ts-expect-error -- private property
            expect(manager.floor.canvas.on).toHaveBeenCalledWith(
                "object:modified",
                // @ts-expect-error -- private method
                manager.snapToGridOnModify,
            );
            // @ts-expect-error -- private property
            expect(manager.floor.canvas.on).toHaveBeenCalledWith(
                "mouse:up",
                // @ts-expect-error -- private method
                manager.onEditorMouseUp,
            );
        });
    });

    describe("EditorEventManager - Mouse Up Event Handling", () => {
        it("should call elementClickHandler when there is no active object on canvas", () => {
            // @ts-expect-error -- auto mocked property, Mock that there's no active object
            manager.floor.canvas.getActiveObject.mockReturnValue(null);

            // @ts-expect-error -- private method
            manager.onEditorMouseUp();

            // @ts-expect-error -- private property
            expect(manager.floor.emit).toHaveBeenCalledWith(
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
            // Setup mock for getActiveObjects and getActiveObject
            const activeObject = new fabric.Object();
            const mockGroup = new fabric.Group();
            // @ts-expect-error -- private prop
            const mockCanvas = manager.floor.canvas;
            mockCanvas.getActiveObjects = vi.fn().mockReturnValue([activeObject]);
            mockCanvas.getActiveObject = vi.fn().mockReturnValue(mockGroup);

            const mockEvent = {
                e: { movementX: 5, movementY: 10 },
            } as unknown as fabric.IEvent<MouseEvent>;
            // Simulate Control key being pressed
            manager.ctrlPressedDuringSelection = true;

            manager.handleObjectMoving(mockEvent);

            // Now we need to test if 'set' was called with the correct arguments
            expect(activeObject.set).toHaveBeenCalledWith({
                left: expect.any(Number),
                top: expect.any(Number),
            });

            expect(activeObject.left).toBe(5);
            expect(activeObject.top).toBe(10);
        });
    });

    describe("EditorEventManager - Destroy Method", () => {
        it("should remove all event listeners when destroy is called", () => {
            // Call the destroy method
            manager.destroy();

            // Check if removeEventListener has been called for each event
            expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
                "keydown",
                expect.any(Function),
            );
            expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
                "keyup",
                expect.any(Function),
            );
        });
    });
});
