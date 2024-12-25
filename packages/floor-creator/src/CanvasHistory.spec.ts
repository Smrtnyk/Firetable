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
