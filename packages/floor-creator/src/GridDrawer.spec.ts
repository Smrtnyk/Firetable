import { Canvas } from "fabric";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GridDrawer } from "./GridDrawer.js";

describe("GridDrawer", () => {
    let gridDrawer: GridDrawer;
    let canvas: Canvas;

    beforeEach(() => {
        canvas = new Canvas(document.createElement("canvas"));
        gridDrawer = new GridDrawer(canvas);
    });

    it("should be initialized with grid visibility set to true", () => {
        expect(gridDrawer.isGridVisible).toBe(true);
    });

    it("should draw grid lines on the canvas", () => {
        const drawSpy = vi.spyOn(gridDrawer, "drawGrid");
        gridDrawer.drawGrid(1000, 1000);
        expect(drawSpy).toHaveBeenCalled();
        expect(canvas.getObjects().length).toBeGreaterThan(0);
    });

    describe("Grid Toggling", () => {
        it("should toggle the grid visibility", () => {
            gridDrawer.toggleGridVisibility(1000, 1000);
            expect(gridDrawer.isGridVisible).toBe(false);
            expect(canvas.getObjects().length).toBe(0);

            gridDrawer.toggleGridVisibility(1000, 1000);
            expect(gridDrawer.isGridVisible).toBe(true);
            expect(canvas.getObjects().length).toBe(1);
        });
    });

    describe("Grid Clearing", () => {
        it("should clear the grid from the canvas", () => {
            gridDrawer.drawGrid(1000, 1000);
            expect(canvas.getObjects().length).toBeGreaterThan(0);

            gridDrawer.clearGrid();
            expect(canvas.getObjects().length).toBe(0);
        });
    });
});
