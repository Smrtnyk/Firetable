import type { MockInstance } from "vitest";
import type { FloorCreationOptions } from "./types";
import { FloorElementTypes } from "./types";
import { FloorEditor } from "./FloorEditor";
import { GridDrawer } from "./GridDrawer";
import { isTable } from "./type-guards";
import { RectTable } from "./elements/RectTable";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Group, Rect } from "fabric";

describe("FloorEditor", () => {
    let floorEditor: FloorEditor;
    let canvasElement: HTMLCanvasElement;
    let gridDrawerSpy: MockInstance<Parameters<typeof GridDrawer.prototype.drawGrid>, void>;

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
            containerWidth: 1000,
        };

        gridDrawerSpy = vi.spyOn(GridDrawer.prototype, "drawGrid");

        floorEditor = new FloorEditor(options);
    });

    describe("constructor()", () => {
        it("properly initializes properties and sub-components", () => {
            expect(floorEditor).toBeInstanceOf(FloorEditor);
            // @ts-expect-error -- private prop
            expect(floorEditor.gridDrawer).toBeDefined();
            // @ts-expect-error -- private prop
            expect(floorEditor.eventManager).toBeDefined();
            // @ts-expect-error -- private prop
            expect(floorEditor.elementManager).toBeDefined();
        });

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
            // Create a mock fabric object
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
                rectOptions: {},
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
            const [table] = floorEditor.canvas.getObjects().filter(isTable);
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
