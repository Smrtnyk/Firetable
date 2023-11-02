import { Floor } from "../Floor";

jest.mock("fabric");

import { EditorEventManager } from "./EditorEventManager";
import { fabric } from "fabric";
import { RESOLUTION } from "../constants";

describe("EditorEventManager", () => {
    let manager: EditorEventManager;
    let mockTarget: fabric.Object;

    beforeEach(() => {
        // Mocking canvas and other related methods
        const mockCanvas = {
            on: jest.fn(),
            getActiveObject: jest.fn(),
            renderAll: jest.fn(),
        } as unknown as fabric.Canvas;

        const mockFloor = {
            canvas: mockCanvas,
            elementClickHandler: jest.fn(),
            emit: jest.fn(),
        } as unknown as Floor;

        mockTarget = {
            set: jest.fn().mockReturnThis(),
            setCoords: jest.fn(),
        } as unknown as fabric.Object;

        manager = new EditorEventManager(mockFloor);
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
});
