import type { FloorData } from "./types.js";
import { FloorEditor } from "./FloorEditor.js";
import {
    extractAllTablesLabels,
    getTables,
    getTablesFromFloorDoc,
    hasFloorTables,
} from "./filters.js";
import { RectTable } from "./elements/RectTable.js";
import { FloorElementTypes } from "./types.js";
import { expect, it, describe, beforeEach } from "vitest";

describe("Table Management Functions", () => {
    let floor: FloorEditor;

    beforeEach(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        floor = new FloorEditor({
            canvas,
            floorDoc: {
                id: "test-id",
                name: "test floor",
                width: 1000,
                height: 1000,
                json: {},
            },
            containerWidth: 1000,
        });
    });

    describe("hasFloorTables function", () => {
        it("should return false when there are no tables on the floor", () => {
            expect(hasFloorTables(floor)).toBe(false);
        });

        it("should return true when there are tables on the floor", () => {
            // Assuming floor has a method to add tables, adjust as needed
            floor.addElement({
                tag: FloorElementTypes.RECT_TABLE,
                x: 1,
                y: 1,
                label: "1",
            });
            expect(hasFloorTables(floor)).toBe(true);
        });
    });

    describe("getTables function", () => {
        it("should return an empty array when there are no tables on the floor", () => {
            expect(getTables(floor)).toEqual([]);
        });

        it("should return an array of tables on the floor", () => {
            floor.addElement({
                tag: FloorElementTypes.RECT_TABLE,
                x: 1,
                y: 1,
                label: "1",
            });
            floor.addElement({
                tag: FloorElementTypes.ROUND_TABLE,
                x: 1,
                y: 1,
                label: "1",
            });
            expect(getTables(floor).length).toEqual(2);
        });
    });

    describe("extractAllTablesLabels function", () => {
        it("should return an empty array when there are no tables on the floor", () => {
            expect(extractAllTablesLabels(floor)).toEqual([]);
        });

        it("should return an array of labels of all tables on the floor", () => {
            const table1 = new RectTable({
                shapeOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            const table2 = new RectTable({
                shapeOptions: {},
                groupOptions: {
                    label: "2",
                },
                textOptions: {
                    label: "2",
                },
            });
            floor.canvas.add(table1);
            floor.canvas.add(table2);
            expect(extractAllTablesLabels(floor)).toEqual(["1", "2"]);
        });
    });

    describe("getTablesFromFloorDoc function", () => {
        it("should return an array of BaseTable objects from a FloorDoc", () => {
            const table1 = new RectTable({
                shapeOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            const floorDoc = {
                json: {
                    objects: [table1.toObject()],
                },
            };
            const tables = getTablesFromFloorDoc(floorDoc as unknown as FloorData);
            expect(tables).toEqual(expect.any(Array));
            tables.forEach((table) => {
                expect(table.type).toBe(FloorElementTypes.RECT_TABLE);
            });
        });
    });
});
