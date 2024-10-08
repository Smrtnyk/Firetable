import type { MockInstance } from "vitest";
import type { FloorCreationOptions } from "./types.js";
import { FloorElementTypes } from "./types.js";
import { FloorEditor } from "./FloorEditor.js";
import { GridDrawer } from "./GridDrawer.js";
import { isTable } from "./type-guards.js";
import { RectTable } from "./elements/RectTable.js";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Group, Rect } from "fabric";

describe("FloorEditor", () => {
    let floorEditor: FloorEditor;
    let canvasElement: HTMLCanvasElement;
    let gridDrawerSpy: MockInstance<typeof GridDrawer.prototype.drawGrid>;

    beforeEach(async () => {
        canvasElement = document.createElement("canvas");
        const options: FloorCreationOptions = {
            canvas: canvasElement,
            floorDoc: {
                id: "test-id",
                name: "test floor",
                width: 1000,
                height: 1000,
                json: {},
            },
            containerWidth: 1000,
        };

        gridDrawerSpy = vi.spyOn(GridDrawer.prototype, "drawGrid");

        floorEditor = new FloorEditor(options);

        await new Promise((resolve) => {
            floorEditor.on("rendered", resolve);
        });
    });

    describe("constructor()", () => {
        it("should render the initial grid", () => {
            expect(gridDrawerSpy).toHaveBeenCalled();
        });
    });

    describe("updateDimensions()", () => {
        it("updates floor dimensions", () => {
            floorEditor.updateDimensions(800, 800);

            expect(floorEditor.width).toBe(800);
            expect(floorEditor.height).toBe(800);
        });

        it("updates floor dimensions without resetting the floor state", () => {
            // Add an element to the floor
            floorEditor.addElement({
                tag: FloorElementTypes.RECT_TABLE,
                x: 100,
                y: 100,
                label: "Test Table",
            });

            // Modify the element (optional)
            const table = floorEditor.canvas.getObjects().find(isTable);
            if (table) {
                table.set("angle", 45);
            }

            // Get the initial state of the canvas
            const initialObjects = floorEditor.canvas.getObjects().map((obj) => obj.toObject());

            // Update dimensions
            floorEditor.updateDimensions(800, 800);

            // Get the state of the canvas after updating dimensions
            const updatedObjects = floorEditor.canvas.getObjects().map((obj) => obj.toObject());

            // The number of objects should be the same
            expect(updatedObjects.length).toBe(initialObjects.length);

            // make sure added table element is unchanged
            expect(updatedObjects[1]).toEqual(initialObjects[1]);
        });

        it("does not call renderData when updating dimensions", () => {
            const renderDataSpy = vi.spyOn(floorEditor, "renderData");

            floorEditor.updateDimensions(800, 800);

            expect(renderDataSpy).not.toHaveBeenCalled();
        });
    });

    describe("canUndo()", () => {
        it("can't undo in fresh state", () => {
            expect(floorEditor.canUndo()).toBe(false);
        });
    });

    describe("canRedo()", () => {
        it("can't undo in fresh state", () => {
            expect(floorEditor.canRedo()).toBe(false);
        });
    });

    describe("undo()/redo()", () => {
        it("allows undo and redo after moving an object", () => {
            const mockFabricObject = new Rect({
                left: 100,
                top: 100,
                width: 60,
                height: 70,
            });

            // Add the mock object to the canvas
            floorEditor.canvas.add(mockFabricObject);

            // Simulate the start of a transform, such as a user starting to drag the object
            // @ts-expect-error -- private prop
            floorEditor.eventManager.onBeforeTransform({
                transform: { target: mockFabricObject },
            } as any);

            // Simulate the object being moved by the user
            mockFabricObject.set({ left: 200, top: 200 });
            floorEditor.canvas.setActiveObject(mockFabricObject);

            // Simulate the end of the transform, such as the user releasing the mouse button
            // @ts-expect-error -- private prop
            floorEditor.eventManager.onObjectModified({
                target: mockFabricObject,
            } as any);

            // Check if the move was recorded and can be undone
            expect(floorEditor.canUndo()).toBe(true);

            // Undo the move
            floorEditor.undo();
            expect(mockFabricObject.left).toBe(100);
            expect(mockFabricObject.top).toBe(100);

            // Redo the move
            floorEditor.redo();
            expect(mockFabricObject.left).toBe(200);
            expect(mockFabricObject.top).toBe(200);
        });
    });

    describe("emit()", () => {
        it("emits elementClicked event on element click", () => {
            const spy = vi.spyOn(floorEditor, "emit");
            const table = new RectTable({
                shapeOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            // @ts-expect-error -- private prop
            floorEditor.onElementClick(table);
            expect(spy).toHaveBeenCalledWith("elementClicked", floorEditor, table);
        });

        it("emits doubleClick event on canvas double click", () => {
            const spy = vi.spyOn(floorEditor, "emit");
            // Simulate double click on the floor
            floorEditor.onFloorDoubleTap([100, 200]);
            expect(spy).toHaveBeenCalledWith("doubleClick", floorEditor, [100, 200]);
        });
    });

    describe("addElement()", () => {
        it("should add an element to the canvas", () => {
            floorEditor.addElement({
                tag: FloorElementTypes.RECT_TABLE,
                x: 1,
                y: 1,
                label: "1",
            });
            // Check if the element was added to the canvas
            const table = floorEditor.canvas.getObjects().find(isTable);
            // Assume getObjects returns an array of fabric.Object, and we added a fabric.Rect for instance
            expect(table).toBeInstanceOf(Group);
        });
    });

    describe("toggleGridVisibility()", () => {
        it("toggles grid visibility", () => {
            // @ts-expect-error -- private prop
            const initialVisibility = floorEditor.gridDrawer.isGridVisible;
            floorEditor.toggleGridVisibility();
            // @ts-expect-error -- private prop
            expect(floorEditor.gridDrawer.isGridVisible).toBe(!initialVisibility);
        });

        it("re-renders grid after updating dimensions", () => {
            const spy = vi.spyOn(floorEditor, "renderGrid");
            floorEditor.updateDimensions(500, 500);
            expect(spy).toHaveBeenCalled();
        });
    });
});
