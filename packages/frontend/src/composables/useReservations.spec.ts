import { reactive, Ref, ref } from "vue";
import { useReservations } from "./useReservations";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { EventDoc, User } from "@firetable/types";
import * as backend from "@firetable/backend";
import * as uiHelpers from "../helpers/ui-helpers";
import { FloorElementTypes, FloorMode, FloorViewer, RectTable } from "@firetable/floor-creator";
import { uid } from "quasar";
import { NOOP } from "@firetable/utils";

function createFloor(floorName: string): FloorViewer {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    return new FloorViewer({
        canvas,
        floorDoc: {
            id: uid(),
            name: floorName,
            width: 1000,
            height: 1000,
            json: {
                objects: [
                    createTable("table1").toObject(),
                    createTable("table2").toObject(),
                    createTable("table3").toObject(),
                    createReservedTable("reserved1").toObject(),
                ],
            },
            propertyId: "",
        },
        mode: FloorMode.LIVE,
        containerWidth: 1000,
    });
}

function createTable(label: string): RectTable {
    return new RectTable({
        rectOptions: {},
        groupOptions: {
            label,
        },
        textOptions: {
            label,
        },
    });
}

const mockReservation = {
    guestName: "foo",
    confirmed: false,
    numberOfGuests: 1,
    consumption: 1,
    time: "12:00",
    reservedBy: {
        name: "foo",
        email: "bar",
    },
};

function createReservedTable(label: string) {
    const table = createTable(label);
    table.setReservation(mockReservation);
    return table;
}

describe("useReservations", () => {
    let users: Ref<User[]>;
    let floorInstances: Set<FloorViewer>;
    let eventOwner: backend.EventOwner;
    let event: Ref<EventDoc>;
    let floor1: FloorViewer;

    beforeEach(() => {
        users = ref([]);
        floor1 = createFloor("test-1");
        const floor2 = createFloor("test-2");
        floorInstances = reactive(new Set([floor1, floor2]));
        eventOwner = {
            propertyId: "1",
            organisationId: "2",
            id: "3",
        };
        event = ref<EventDoc>({
            id: "3",
            name: "test event",
            creator: "test creator",
            date: Date.now(),
            entryPrice: 1,
            guestListLimit: 100,
            propertyId: "1",
            organisationId: "2",
            _doc: this,
        });
    });

    it("should compute allReservedTables correctly", () => {
        const { allReservedTables } = useReservations(
            users,
            floorInstances,
            eventOwner,
            event,
            NOOP,
        );
        expect(allReservedTables.value.length).toBe(2);
    });

    it("should compute freeTablesPerFloor correctly", () => {
        const { freeTablesPerFloor } = useReservations(
            users,
            floorInstances,
            eventOwner,
            event,
            NOOP,
        );
        // two floors
        expect(freeTablesPerFloor.value.size).toBe(2);
        // 6 free tables
        freeTablesPerFloor.value.forEach((value) => {
            expect(value.length).toBe(3);
        });
    });

    it("should handle reservation creation correctly", () => {
        const updateEventFloorDataSpy = vi
            .spyOn(backend, "updateEventFloorData")
            .mockReturnValue(undefined);

        const { handleReservationCreation } = useReservations(
            users,
            floorInstances,
            eventOwner,
            event,
            NOOP,
        );
        const [table] = floor1.canvas.getObjects(FloorElementTypes.RECT_TABLE) as RectTable[];
        const setReservationSpy = vi.spyOn(table, "setReservation");
        handleReservationCreation(floor1, mockReservation, table);

        expect(setReservationSpy).toHaveBeenCalledWith(mockReservation);
        expect(updateEventFloorDataSpy).toHaveBeenCalledWith(eventOwner, floor1);
    });

    it("should handle reservation deletion correctly", async () => {
        vi.spyOn(uiHelpers, "showConfirm").mockResolvedValue(true);
        const updateEventFloorDataSpy = vi
            .spyOn(backend, "updateEventFloorData")
            .mockReturnValue(undefined);
        const { onDeleteReservation, allReservedTables } = useReservations(
            users,
            floorInstances,
            eventOwner,
            event,
            NOOP,
        );
        const [table] = allReservedTables.value;
        const setReservationSpy = vi.spyOn(table, "setReservation");
        await onDeleteReservation(floor1, table);
        expect(setReservationSpy).toHaveBeenCalledWith(null);
        expect(updateEventFloorDataSpy).toHaveBeenCalledWith(eventOwner, floor1);
    });
});
