import type { FabricObject } from "fabric";

import { delay, last, range } from "es-toolkit";
import { ActiveSelection } from "fabric";
import { describe, expect, it } from "vitest";

import type { RectTable } from "./elements/RectTable.js";

import { FloorEditor } from "./FloorEditor.js";
import { FloorElementTypes } from "./types.js";
import { canvasToRender } from "./utils.js";

interface TablePosition {
    left: number;
    top: number;
}

interface TestContext {
    canvas: HTMLCanvasElement;
    floor: FloorEditor;
}

describe("CanvasHistory", () => {
    it("starts with empty undo/redo stacks", () => {
        const { floor } = setupTestFloor();
        expect(floor.canUndo()).toBe(false);
        expect(floor.canRedo()).toBe(false);
    });

    it("preserves grid during undo/redo", async () => {
        const { floor } = setupTestFloor();

        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        await moveTable(floor, table, { left: 200, top: 200 });

        await floor.undo();
        expect(floor.gridDrawer.isGridVisible).toBe(true);

        await floor.redo();
        expect(floor.gridDrawer.isGridVisible).toBe(true);
    });

    it("records a history entry even if the net change is zero", async () => {
        const { floor } = setupTestFloor();
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        floor.markAsSaved();

        table.set({ left: 200 });
        floor.canvas.fire("object:modified", { target: table });
        table.set({ left: 100 });
        floor.canvas.fire("object:modified", { target: table });
        await canvasToRender(floor.canvas);

        // Although the final state is equal to the saved state (so isDirty() is false),
        // the discrete actions are still recorded, so undo should be available.
        expect(floor.isDirty()).toBe(false);
        expect(floor.canUndo()).toBe(true);
    });

    it("handles long undo/redo cycles without losing state", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        const table = floor.getTableByLabel("T1")!;

        for (let pos = 150; pos <= 300; pos += 50) {
            table.set({ left: pos });
            floor.canvas.fire("object:modified", { target: table });
            await canvasToRender(floor.canvas);
        }

        while (floor.canUndo()) {
            await floor.undo();
        }

        while (floor.canRedo()) {
            await floor.redo();
        }

        expect(table.left).toBe(300);
    });

    it("handles undo/redo calls gracefully when no history is available", async () => {
        const { floor } = setupTestFloor();
        await floor.undo();
        await floor.redo();
        expect(floor.canUndo()).toBe(false);
        expect(floor.canRedo()).toBe(false);
    });

    it("tracks element addition", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });

        await delay(0);

        expect(floor.canUndo()).toBe(true);
        expect(floor.canRedo()).toBe(false);
    });

    it("handles undo/redo of element movement", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });

        const table = floor.getTableByLabel("T1")!;
        const originalLeft = table.left;

        table.set({ left: 200 });
        floor.canvas.fire("object:modified", { target: table });

        await delay(0);

        expect(floor.canUndo()).toBe(true);

        await floor.undo();

        const tableAfterUndo = floor.getTableByLabel("T1")!;
        expect(tableAfterUndo.left).toBe(originalLeft);
    });

    it("handles multiple state changes", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        floor.addElement({
            label: "T2",
            tag: FloorElementTypes.RECT_TABLE,
            x: 200,
            y: 200,
        });

        await delay(0);

        const table1 = floor.getTableByLabel("T1")!;
        table1.set({ left: 300 });
        floor.canvas.fire("object:modified", { target: table1 });

        await delay(0);

        let undoCount = 0;
        while (floor.canUndo()) {
            await floor.undo();
            undoCount++;
        }

        expect(undoCount).toBeGreaterThan(1);
    });

    it("maintains state consistency through undo/redo cycles", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });

        const table = floor.getTableByLabel("T1")!;
        const positions = [200, 300, 400].map((x) => ({ left: x, top: table.top }));

        // Move table to different positions
        for (const pos of positions) {
            table.set(pos);
            floor.canvas.fire("object:modified", { target: table });
            await delay(0);
        }

        // Undo all moves
        while (floor.canUndo()) {
            await floor.undo();
        }

        // Redo all moves
        while (floor.canRedo()) {
            await floor.redo();
        }

        expect(table.left).toBe(last(positions)!.left);
    });

    it("maintains max default stack size", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        const table = floor.getTableByLabel("T1")!;

        for (const i of range(60)) {
            table.set({ left: 100 + i * 10 });
            floor.canvas.fire("object:modified", { target: table });
            await delay(0);
        }

        // Check that stack size is limited
        let undoCount = 0;
        while (floor.canUndo()) {
            await floor.undo();
            undoCount++;
        }
        // Default max size
        expect(undoCount).toBeLessThanOrEqual(50);
    });

    it("handles group operations", async () => {
        const { floor } = setupTestFloor();

        const table1 = await addTable(floor, { left: 100, top: 100 }, "T1");
        const table2 = await addTable(floor, { left: 200, top: 200 }, "T2");

        floor.canvas.setActiveObject(
            new ActiveSelection([table1, table2], { canvas: floor.canvas }),
        );
        await moveTable(floor, floor.canvas.getActiveObject()!, {
            left: 300,
            top: 300,
        });

        await floor.undo();
        expect(floor.getTableByLabel("T1")?.left).toBe(100);
        expect(floor.getTableByLabel("T2")?.left).toBe(200);
    });

    it("handles element rotation", async () => {
        const { floor } = setupTestFloor();

        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        await canvasToRender(floor.canvas);
        const originalAngle = table.angle;

        table.rotate(45);
        table.setCoords();
        floor.canvas.requestRenderAll();
        floor.canvas.fire("object:modified", { target: table });
        await canvasToRender(floor.canvas);

        expect(table.angle).toBe(45);
        expect(floor.canUndo()).toBe(true);

        // Undo creates new state so table reference is no longer valid
        await floor.undo();
        table.setCoords();
        await canvasToRender(floor.canvas);

        expect(floor.getTableByLabel("T1")?.angle).toBe(originalAngle);
    });

    it("handles rapid state changes", async () => {
        const { floor } = setupTestFloor();
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");

        const movements = range(5).map((i) => ({
            left: 100 + i * 50,
            top: 100,
        }));

        await Promise.all(
            movements.map(function (pos) {
                return moveTable(floor, table, pos);
            }),
        );

        expect(table.left).toBe(movements.at(-1)!.left);
        let undoCount = 0;
        while (floor.canUndo()) {
            await floor.undo();
            undoCount++;
        }
        expect(undoCount).toBe(5);
    });

    it("treats the loaded initial state as saved when initialize calls markAsSaved()", async () => {
        const { floor } = setupTestFloor();

        // Because we've put `markAsSaved()` inside `initialize()`,
        // the new floor is automatically considered 'clean'.
        expect(floor.isDirty()).toBe(false);

        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);

        await floor.undo();

        // Now we should be back to the initial state,
        // which was saved by `markAsSaved()` in initialize().
        // So isDirty should be false again
        expect(floor.isDirty()).toBe(false);
    });

    it("treats the loaded non-empty floor as the saved baseline if initialize calls markAsSaved()", async () => {
        const { floor } = await setupTestFloorWithTableInJSON();

        // Right after constructor + initialize(), we expect isDirty=false
        // because `markAsSaved()` was called in `initialize()`.
        expect(floor.isDirty()).toBe(false);

        // Now let's move that pre-existing table from (100, 100) to (120, 120)
        const table = floor.getTableByLabel("T1")!;
        table.set({ left: 120, top: 120 });
        floor.canvas.fire("object:modified", { target: table });
        await canvasToRender(floor.canvas);

        // isDirty should be true
        expect(floor.isDirty()).toBe(true);

        // Undo - we should go back to (100, 100)
        await floor.undo();

        // Because that exactly matches the *initial loaded JSON*,
        // if `markAsSaved()` was called, isDirty = false.
        expect(floor.isDirty()).toBe(false);
    });

    it("sets isDirty to true after an element is added", async () => {
        const { floor } = setupTestFloor();

        expect(floor.isDirty()).toBe(false);

        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);
    });

    it("resets isDirty to false after markAsSaved()", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            label: "T1",
            tag: FloorElementTypes.RECT_TABLE,
            x: 100,
            y: 100,
        });
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);

        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);
    });

    it("sets isDirty to true after removing an object", async () => {
        const { floor } = setupTestFloor();
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        // Start from a 'clean' state
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.canvas.remove(table);
        floor.canvas.fire("object:removed", { target: table });
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);
    });

    it("keeps isDirty in sync after undo/redo", async () => {
        const { floor } = setupTestFloor();

        // 1) Add a table & mark saved -> isDirty=false
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        // 2) Move the table -> isDirty=true
        table.set({ left: 200 });
        floor.canvas.fire("object:modified", { target: table });
        await canvasToRender(floor.canvas);
        expect(floor.isDirty()).toBe(true);

        // 3) Undo -> if we revert to the lastSavedJson, isDirty=false
        await floor.undo();
        expect(floor.isDirty()).toBe(false);

        // 4) Redo -> moves table again, different from lastSaved -> isDirty=true
        await floor.redo();
        expect(floor.isDirty()).toBe(true);
    });

    it("remains isDirty=false if we try to modify but return to same position", async () => {
        const { floor } = setupTestFloor();
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        floor.markAsSaved();

        // Move out & back in the same 'mousedown' event? For simplicity:
        // 1) Move table to 200
        table.set({ left: 200 });
        floor.canvas.fire("object:modified", { target: table });
        // 2) Move back to 100
        table.set({ left: 100 });
        floor.canvas.fire("object:modified", { target: table });

        await canvasToRender(floor.canvas);

        // Because the final JSON is the same as the lastSavedJson,
        // CanvasHistory won't push a new state
        expect(floor.isDirty()).toBe(false);
    });

    it("stays dirty after partial undo if still different than last saved state", async () => {
        const { floor } = setupTestFloor();

        // Add 2 tables with distinct positions
        await addTable(floor, { left: 100, top: 100 }, "T1");
        const table2 = await addTable(floor, { left: 200, top: 200 }, "T2");

        // Mark the current state as saved (2 tables on canvas)
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        // Move table2 from 200 -> 300
        table2.set({ left: 300 });
        floor.canvas.fire("object:modified", { target: table2 });
        await canvasToRender(floor.canvas);
        expect(floor.isDirty()).toBe(true);

        // Undo once => removes the move of table2, returning it to 200
        await floor.undo();
        // Now we have table1 at 100, table2 at 200, exactly the lastSaved state
        expect(floor.isDirty()).toBe(false);

        // Re-query the T1 object from the canvas, because the old reference is stale
        const table1 = floor.getTableByLabel("T1")!;
        table1.set({ left: 150 });
        table1.setCoords();
        floor.canvas.fire("object:modified", { target: table1 });
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);

        // Undo once => returns table1 to 100
        await floor.undo();
        // Because that matches the lastSavedJson again, isDirty should be false
        expect(floor.isDirty()).toBe(false);
    });

    it("handles element fill changes", async () => {
        const { floor } = setupTestFloor();

        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.setElementFill(table, "red");
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);
        expect(floor.canUndo()).toBe(true);

        await floor.undo();
        await canvasToRender(floor.canvas);
        expect(floor.isDirty()).toBe(false);

        await floor.redo();
        await canvasToRender(floor.canvas);
        expect(floor.isDirty()).toBe(true);
    });

    it("detects changes to the background color in the canvas JSON", async () => {
        const { floor } = setupTestFloor();

        floor.setBackgroundColor("#333");
        await canvasToRender(floor.canvas);

        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.setBackgroundColor("#444");
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);

        await floor.undo();
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(false);
    });

    it("handles floor dimension changes in undo/redo", async () => {
        const { floor } = setupTestFloor();
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.updateDimensions(600, 400);
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);
        expect(floor.width).toBe(600);
        expect(floor.height).toBe(400);

        await floor.undo();
        expect(floor.width).toBe(500);
        expect(floor.height).toBe(500);
        expect(floor.isDirty()).toBe(false);

        await floor.redo();
        expect(floor.width).toBe(600);
        expect(floor.height).toBe(400);
        expect(floor.isDirty()).toBe(true);
    });

    it("does not create new history if dimensions are unchanged", async () => {
        const { floor } = setupTestFloor();
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.updateDimensions(500, 500);
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(false);
        expect(floor.canUndo()).toBe(false);
    });

    it("handles partial dimension changes (e.g., just width)", async () => {
        const { floor } = setupTestFloor();
        floor.markAsSaved();
        expect(floor.isDirty()).toBe(false);

        floor.updateDimensions(600, 500);
        await canvasToRender(floor.canvas);

        expect(floor.isDirty()).toBe(true);
        expect(floor.width).toBe(600);
        expect(floor.height).toBe(500);

        await floor.undo();
        expect(floor.width).toBe(500);
        expect(floor.height).toBe(500);
        expect(floor.isDirty()).toBe(false);
    });
});

async function addTable(
    floor: FloorEditor,
    position: TablePosition,
    label: string,
): Promise<RectTable> {
    floor.addElement({
        label,
        tag: FloorElementTypes.RECT_TABLE,
        x: position.left,
        y: position.top,
    });
    await canvasToRender(floor.canvas);
    return floor.getTableByLabel(label)!;
}

async function moveTable(
    floor: FloorEditor,
    table: FabricObject,
    position: TablePosition,
): Promise<void> {
    table.set(position);
    floor.canvas.fire("object:modified", { target: table });
    await canvasToRender(floor.canvas);
}

function setupTestFloor(): TestContext {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    canvas.style.width = "500px";
    canvas.style.height = "500px";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    document.body.appendChild(canvas);
    const container = document.createElement("div");
    container.style.width = "500px";
    container.style.height = "500px";
    const floor = new FloorEditor({
        canvas,
        container,
        floorDoc: {
            height: 500,
            id: "1",
            json: "",
            name: "Test Floor",
            width: 500,
        },
    });

    return { canvas, floor };
}

async function setupTestFloorWithTableInJSON(): Promise<TestContext> {
    const { floor: srcFloor } = setupTestFloor();

    srcFloor.addElement({
        label: "T1",
        tag: FloorElementTypes.RECT_TABLE,
        x: 100,
        y: 100,
    });

    await canvasToRender(srcFloor.canvas);
    const exported = srcFloor.export();

    const newCanvas = document.createElement("canvas");
    newCanvas.width = 500;
    newCanvas.height = 500;
    document.body.appendChild(newCanvas);
    const container = document.createElement("div");
    container.style.width = "500px";
    container.style.height = "500px";
    const floor = new FloorEditor({
        canvas: newCanvas,
        container,
        floorDoc: {
            id: "1",
            name: "Test Floor",
            ...exported,
        },
    });

    await canvasToRender(floor.canvas);

    return { canvas: newCanvas, floor };
}
