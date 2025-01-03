import type { MockInstance } from "vitest";
import type { FloorCreationOptions } from "./types.js";
import { FloorElementTypes } from "./types.js";
import { FloorEditor } from "./FloorEditor.js";
import { GridDrawer } from "./GridDrawer.js";
import { isTable } from "./type-guards.js";
import { RectTable } from "./elements/RectTable.js";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Group } from "fabric";

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
            containerHeight: 1000,
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
            const initialVisibility = floorEditor.gridDrawer.isGridVisible;
            floorEditor.toggleGridVisibility();
            expect(floorEditor.gridDrawer.isGridVisible).toBe(!initialVisibility);
        });

        it("re-renders grid after updating dimensions", () => {
            const spy = vi.spyOn(floorEditor, "renderGrid");
            floorEditor.updateDimensions(500, 500);
            expect(spy).toHaveBeenCalled();
        });
    });
});
