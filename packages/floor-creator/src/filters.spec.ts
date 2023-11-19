import { expect, it, describe, beforeEach } from "vitest";
import { FloorEditor } from "./FloorEditor";
import {
    extractAllTablesLabels,
    getFreeTables,
    getTables,
    getTablesFromFloorDoc,
    hasFloorTables,
} from "./filters";
import { RectTable } from "./elements/RectTable";
import { ElementTag, FloorDoc } from "@firetable/types";

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
                propertyId: "",
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
                tag: ElementTag.RECT,
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
                tag: ElementTag.RECT,
                x: 1,
                y: 1,
                label: "1",
            });
            floor.addElement({
                tag: ElementTag.CIRCLE,
                x: 1,
                y: 1,
                label: "1",
            });
            expect(getTables(floor).length).toEqual(2);
        });
    });

    describe("getFreeTables function", () => {
        it("should return an empty array when there are no free tables on the floor", () => {
            const reservedTable = new RectTable({
                rectOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            reservedTable.setReservation({
                guestName: "foo",
                confirmed: false,
                numberOfGuests: 1,
                consumption: 1,
                time: "12:00",
                reservedBy: {
                    name: "foo",
                    email: "bar",
                },
            });
            floor.canvas.add(reservedTable);
            expect(getFreeTables(floor)).toEqual([]);
        });

        it("should return an array of free tables on the floor", () => {
            const freeTable = new RectTable({
                rectOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            floor.canvas.add(freeTable);
            expect(getFreeTables(floor)).toEqual([freeTable]);
        });
    });

    describe("extractAllTablesLabels function", () => {
        it("should return an empty array when there are no tables on the floor", () => {
            expect(extractAllTablesLabels(floor)).toEqual([]);
        });

        it("should return an array of labels of all tables on the floor", () => {
            const table1 = new RectTable({
                rectOptions: {},
                groupOptions: {
                    label: "1",
                },
                textOptions: {
                    label: "1",
                },
            });
            const table2 = new RectTable({
                rectOptions: {},
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
                rectOptions: {},
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
            const tables = getTablesFromFloorDoc(floorDoc as unknown as FloorDoc);
            expect(tables).toEqual(expect.any(Array));
            tables.forEach((table) => {
                expect(table.type).toBe(ElementTag.RECT);
            });
        });
    });
});
