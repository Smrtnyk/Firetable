import { beforeEach, describe, expect, it } from "vitest";

import type { FloorData } from "./types.js";

import { RectTable } from "./elements/RectTable.js";
import {
    extractAllTablesLabels,
    getTables,
    getTablesFromFloorDoc,
    hasFloorTables,
} from "./filters.js";
import { FloorEditor } from "./FloorEditor.js";
import { FloorElementTypes } from "./types.js";

describe("Table Management Functions", () => {
    let floor: FloorEditor;

    beforeEach(() => {
        const container = document.createElement("div");
        container.style.width = "1000px";
        container.style.height = "1000px";
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        floor = new FloorEditor({
            canvas,
            container,
            floorDoc: {
                height: 1000,
                id: "test-id",
                json: {},
                name: "test floor",
                width: 1000,
            },
        });
    });

    describe("hasFloorTables function", () => {
        it("should return false when there are no tables on the floor", () => {
            expect(hasFloorTables(floor)).toBe(false);
        });

        it("should return true when there are tables on the floor", () => {
            floor.addElement({
                label: "1",
                tag: FloorElementTypes.RECT_TABLE,
                x: 1,
                y: 1,
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
                label: "1",
                tag: FloorElementTypes.RECT_TABLE,
                x: 1,
                y: 1,
            });
            floor.addElement({
                label: "1",
                tag: FloorElementTypes.ROUND_TABLE,
                x: 1,
                y: 1,
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
                groupOptions: {
                    label: "1",
                },
                shapeOptions: {},
                textOptions: {
                    label: "1",
                },
            });
            const table2 = new RectTable({
                groupOptions: {
                    label: "2",
                },
                shapeOptions: {},
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
                groupOptions: {
                    label: "1",
                },
                shapeOptions: {},
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
