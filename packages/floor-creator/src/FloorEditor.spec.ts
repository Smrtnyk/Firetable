import { describe, it, expect, beforeEach, vi } from "vitest";
import { FloorEditor } from "./FloorEditor";
import { FloorMode, FloorCreationOptions } from "./types";
import { GridDrawer } from "./GridDrawer";
import { ElementTag } from "@firetable/types";
import { isTable } from "./type-guards";
import { fabric } from "fabric";
import { RectTable } from "./elements/RectTable";

describe("FloorEditor", () => {
    let floorEditor: FloorEditor;
    let canvasElement: HTMLCanvasElement;
    let gridDrawerSpy;

    beforeEach(() => {
        canvasElement = document.createElement("canvas");
        const options: FloorCreationOptions = {
            canvas: canvasElement,
            floorDoc: {
                id: "test-id",
                name: "test floor",
                width: 1000,
                height: 1000,
                json: {},
                propertyId: "",
            },
            mode: FloorMode.EDITOR,
            containerWidth: 1000,
        };

        gridDrawerSpy = vi.spyOn(GridDrawer.prototype, "drawGrid");

        floorEditor = new FloorEditor(options);
    });

    it("should properly initialize properties and sub-components", () => {
        expect(floorEditor).toBeInstanceOf(FloorEditor);
        // Assuming we have getters for these properties or they are public
        expect(floorEditor.gridDrawer).toBeDefined();
        expect(floorEditor.eventManager).toBeDefined();
        expect(floorEditor.elementManager).toBeDefined();
        // You could also check if methods have been called in constructor if any
    });

    it("should render the initial grid", () => {
        expect(gridDrawerSpy).toHaveBeenCalled();
    });

    describe("Undo/Redo Functionality", () => {
        it("should return false for canUndo and canRedo initially", () => {
            expect(floorEditor.canUndo()).toBe(false);
            expect(floorEditor.canRedo()).toBe(false);
        });

        it("should allow undo and redo after moving an object", () => {
            // Create a mock fabric object
            const mockFabricObject = new fabric.Rect({
                left: 100,
                top: 100,
                width: 60,
                height: 70,
            });

            // Add the mock object to the canvas
            floorEditor.canvas.add(mockFabricObject);

            // Simulate the start of a transform, such as a user starting to drag the object
            floorEditor.eventManager.onBeforeTransform({
                transform: { target: mockFabricObject },
            } as fabric.IEvent<MouseEvent>);

            // Simulate the object being moved by the user
            mockFabricObject.set({ left: 200, top: 200 });
            floorEditor.canvas.setActiveObject(mockFabricObject);

            // Simulate the end of the transform, such as the user releasing the mouse button
            floorEditor.eventManager.onObjectModified({
                target: mockFabricObject,
            } as fabric.IEvent<MouseEvent>);

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

    describe("Event Emission", () => {
        it("should emit elementClicked event on element click", () => {
            const spy = vi.spyOn(floorEditor, "emit");
            const table = new RectTable({
                rectOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            // Create a mock event object
            const mockEvent = {
                target: table,
            };
            // Simulate the element click
            floorEditor.onElementClick(mockEvent as unknown as fabric.IEvent<MouseEvent>);
            expect(spy).toHaveBeenCalledWith("elementClicked", floorEditor, table);
        });

        it("should emit doubleClick event on canvas double click", () => {
            const spy = vi.spyOn(floorEditor, "emit");
            // Simulate double click on the floor
            floorEditor.onFloorDoubleTap([100, 200]);
            expect(spy).toHaveBeenCalledWith("doubleClick", floorEditor, [100, 200]);
        });
    });

    describe("Element Manipulation", () => {
        it("should add an element to the canvas", () => {
            floorEditor.addElement({
                tag: ElementTag.RECT,
                x: 1,
                y: 1,
                label: "1",
            });
            // Check if the element was added to the canvas
            const [table] = floorEditor.canvas.getObjects().filter(isTable);
            // Assume getObjects returns an array of fabric.Object, and we added a fabric.Rect for instance
            expect(table).toBeInstanceOf(fabric.Group);
        });
    });

    describe("Grid Visibility and Rendering", () => {
        it("should toggle grid visibility", () => {
            const initialVisibility = floorEditor.gridDrawer.isGridVisible;
            floorEditor.toggleGridVisibility();
            expect(floorEditor.gridDrawer.isGridVisible).toBe(!initialVisibility);
        });

        it("should re-render grid after updating dimensions", () => {
            const spy = vi.spyOn(floorEditor, "renderGrid");
            floorEditor.updateDimensions(500, 500);
            expect(spy).toHaveBeenCalled();
        });
    });
});