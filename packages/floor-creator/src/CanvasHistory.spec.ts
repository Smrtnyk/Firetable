import type { FabricObject } from "fabric";
import { FloorEditor } from "./FloorEditor.js";
import { RectTable } from "./elements/RectTable.js";
import { FloorElementTypes } from "./types.js";
import { describe, expect, it } from "vitest";
import { ActiveSelection } from "fabric";
import { last } from "es-toolkit";

interface TablePosition {
    left: number;
    top: number;
}

interface TestContext {
    floor: FloorEditor;
    canvas: HTMLCanvasElement;
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

    it("tracks element addition", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });

        await wait(0);

        expect(floor.canUndo()).toBe(true);
        expect(floor.canRedo()).toBe(false);
    });

    it("handles undo/redo of element movement", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });

        const table = findTable(floor, "T1");
        const originalLeft = table.left;

        table.set({ left: 200 });
        floor.canvas.fire("object:modified", { target: table });

        await wait(0);

        expect(floor.canUndo()).toBe(true);

        await floor.undo();

        const tableAfterUndo = findTable(floor, "T1");
        expect(tableAfterUndo.left).toBe(originalLeft);
    });

    it("handles multiple state changes", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T2",
            x: 200,
            y: 200,
        });

        await wait(0);

        const table1 = findTable(floor, "T1");
        table1.set({ left: 300 });
        floor.canvas.fire("object:modified", { target: table1 });

        await wait(0);

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
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });

        const table = findTable(floor, "T1");
        const positions = [200, 300, 400].map((x) => ({ left: x, top: table.top }));

        // Move table to different positions
        for (const pos of positions) {
            table.set(pos);
            floor.canvas.fire("object:modified", { target: table });
            await wait(0);
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

    it("maintains reasonable stack size", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });
        const table = findTable(floor, "T1");

        // Create many states
        for (let i = 0; i < 30; i++) {
            table.set({ left: 100 + i * 10 });
            floor.canvas.fire("object:modified", { target: table });
            await wait(0);
        }

        // Check that stack size is limited
        let undoCount = 0;
        while (floor.canUndo()) {
            await floor.undo();
            undoCount++;
        }
        // Default max size
        expect(undoCount).toBeLessThanOrEqual(20);
    });

    it("handles group operations", async () => {
        const { floor } = setupTestFloor();

        const table1 = await addTable(floor, { left: 100, top: 100 }, "T1");
        const table2 = await addTable(floor, { left: 200, top: 200 }, "T2");

        // Select both and move
        floor.canvas.setActiveObject(
            new ActiveSelection([table1, table2], { canvas: floor.canvas }),
        );
        await moveTable(floor, floor.canvas.getActiveObject()!, {
            left: 300,
            top: 300,
        });

        // Verify undo/redo works for group operations
        await floor.undo();
        expect(findTable(floor, "T1").left).toBe(100);
        expect(findTable(floor, "T2").left).toBe(200);
    });

    it("handles element rotation", async () => {
        const { floor } = setupTestFloor();

        const table = await addTable(floor, { left: 100, top: 100 }, "T1");
        await waitForCanvasRender(floor);
        const originalAngle = table.angle;

        table.rotate(45);
        table.setCoords();
        floor.canvas.requestRenderAll();
        floor.canvas.fire("object:modified", { target: table });
        await waitForCanvasRender(floor);

        expect(table.angle).toBe(45);
        expect(floor.canUndo()).toBe(true);

        // Undo creates new state so table reference is no longer valid
        await floor.undo();
        table.setCoords();
        await waitForCanvasRender(floor);

        expect(findTable(floor, "T1").angle).toBe(originalAngle);
    });

    it("handles rapid state changes", async () => {
        const { floor } = setupTestFloor();
        const table = await addTable(floor, { left: 100, top: 100 }, "T1");

        // Simulate rapid movements
        const movements = Array.from({ length: 5 }, (_, i) => ({
            left: 100 + i * 50,
            top: 100,
        }));

        await Promise.all(movements.map((pos) => moveTable(floor, table, pos)));

        expect(table.left).toBe(last(movements)!.left);
    });

    it("treats the loaded initial state as saved when initialize calls markAsSaved()", async () => {
        // Step 1: Set up a brand-new floor
        const { floor } = setupTestFloor();

        // Because we've put `markAsSaved()` inside `initialize()`,
        // the new floor is automatically considered 'clean'.
        expect(floor.isDirty()).toBe(false);

        // Step 2: Make a change (add a table)
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });
        await waitForCanvasRender(floor);

        // After adding the table, isDirty should be true
        expect(floor.isDirty()).toBe(true);

        // Step 3: Undo the addition
        await floor.undo();

        // Now we should be back to the initial state,
        // which was saved by `markAsSaved()` in initialize().
        // So isDirty should be false again
        expect(floor.isDirty()).toBe(false);
    });

    it("treats the loaded non-empty floor as the saved baseline if initialize calls markAsSaved()", async () => {
        // Set up a floor with an *existing* table in the JSON
        const { floor } = await setupTestFloorWithTableInJSON();

        // Right after constructor + initialize(), we expect isDirty=false
        // because `markAsSaved()` was called in `initialize()`.
        expect(floor.isDirty()).toBe(false);

        // Now let's move that pre-existing table from (100, 100) to (120, 120)
        const table = findTable(floor, "T1");
        table.set({ left: 120, top: 120 });
        floor.canvas.fire("object:modified", { target: table });
        await waitForCanvasRender(floor);

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

        // Initially, no changes
        expect(floor.isDirty()).toBe(false);

        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });
        await waitForCanvasRender(floor);

        expect(floor.isDirty()).toBe(true);
    });

    it("resets isDirty to false after markAsSaved()", async () => {
        const { floor } = setupTestFloor();
        floor.addElement({
            tag: FloorElementTypes.RECT_TABLE,
            label: "T1",
            x: 100,
            y: 100,
        });
        await waitForCanvasRender(floor);

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

        // Remove the table
        floor.canvas.remove(table);
        floor.canvas.fire("object:removed", { target: table });
        await waitForCanvasRender(floor);

        // Should now be dirty again
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
        await waitForCanvasRender(floor);
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

        await waitForCanvasRender(floor);

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
        await waitForCanvasRender(floor);
        expect(floor.isDirty()).toBe(true);

        // Undo once => removes the move of table2, returning it to 200
        await floor.undo();
        // Now we have table1 at 100, table2 at 200, exactly the lastSaved state
        expect(floor.isDirty()).toBe(false);

        // Re-query the T1 object from the canvas, because the old reference is stale
        const table1 = findTable(floor, "T1");
        table1.set({ left: 150 });
        table1.setCoords();
        floor.canvas.fire("object:modified", { target: table1 });
        await waitForCanvasRender(floor);

        expect(floor.isDirty()).toBe(true);

        // Undo once => returns table1 to 100
        await floor.undo();
        // Because that matches the lastSavedJson again, isDirty should be false
        expect(floor.isDirty()).toBe(false);
    });
});

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function moveTable(
    floor: FloorEditor,
    table: FabricObject,
    position: TablePosition,
): Promise<void> {
    table.set(position);
    floor.canvas.fire("object:modified", { target: table });
    await waitForCanvasRender(floor);
}

async function waitForCanvasRender(floor: FloorEditor): Promise<void> {
    await new Promise<void>((resolve) => {
        floor.canvas.requestRenderAll();
        floor.canvas.once("after:render", () => resolve());
    });
    await wait(0);
}

function findTable(floor: FloorEditor, label?: string): RectTable {
    return floor.canvas.getObjects().find(function (object): object is RectTable {
        return object instanceof RectTable && (!label || object.label === label);
    })!;
}

async function addTable(
    floor: FloorEditor,
    position: TablePosition,
    label: string,
): Promise<RectTable> {
    floor.addElement({
        tag: FloorElementTypes.RECT_TABLE,
        label,
        x: position.left,
        y: position.top,
    });
    await waitForCanvasRender(floor);
    return findTable(floor, label);
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
    const floor = new FloorEditor({
        canvas,
        floorDoc: {
            id: "1",
            name: "Test Floor",
            width: 500,
            height: 500,
            json: "",
        },
        containerWidth: 500,
        containerHeight: 500,
    });

    return { floor, canvas };
}

async function setupTestFloorWithTableInJSON(): Promise<TestContext> {
    const { floor: srcFloor } = setupTestFloor();

    srcFloor.addElement({
        tag: FloorElementTypes.RECT_TABLE,
        label: "T1",
        x: 100,
        y: 100,
    });

    await waitForCanvasRender(srcFloor);
    const exported = srcFloor.export();

    const newCanvas = document.createElement("canvas");
    newCanvas.width = 500;
    newCanvas.height = 500;
    document.body.appendChild(newCanvas);

    const floor = new FloorEditor({
        canvas: newCanvas,
        floorDoc: {
            id: "1",
            name: "Test Floor",
            ...exported,
        },
        containerWidth: 500,
        containerHeight: 500,
    });

    await waitForCanvasRender(floor);

    return { floor, canvas: newCanvas };
}
