import type { Ref } from "vue";
import type { EventDoc, PlannedReservationDoc, ReservationDoc, User } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { ref, shallowRef, toRef } from "vue";
import { FloorViewer, getTables, RectTable } from "@firetable/floor-creator";

function createFloor(floorName: string): FloorViewer {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const id = Math.random().toString();
    return new FloorViewer({
        canvas,
        floorDoc: {
            id,
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
        },
        containerWidth: 1000,
    });
}

function createTable(label: string): RectTable {
    return new RectTable({
        shapeOptions: {},
        groupOptions: {
            label,
        },
        textOptions: {
            label,
        },
    });
}

function createMockReservation(partial: Partial<ReservationDoc> = {}): PlannedReservationDoc {
    const doc = {
        guestName: "foo",
        arrived: false,
        reservationConfirmed: false,
        numberOfGuests: 1,
        consumption: 1,
        time: "12:00",
        cancelled: false,
        status: ReservationStatus.ACTIVE,
        reservedBy: {
            name: "foo",
            email: "bar",
            id: "baz",
        },
        creator: {
            name: "foo",
            email: "bar",
            id: "baz",
            createdAt: {
                seconds: 1,
                nanoseconds: 1,
            } as any,
        },
        floorId: "1",
        tableLabel: "1",
        type: ReservationType.PLANNED,
        isVIP: false,
    };
    return {
        id: "id",
        ...doc,
        _doc: doc,
        ...partial,
    };
}

function createReservedTable(label: string): RectTable {
    return createTable(label);
}

const { addReservationSpy, deleteReservationSpy } = vi.hoisted(() => {
    return {
        addReservationSpy: vi.fn(),
        deleteReservationSpy: vi.fn(),
    };
});

vi.mock("vue-i18n", () => {
    return {
        default: {
            useI18n: () => ({
                t: vi.fn().mockReturnValue("test"),
            }),
        },
        useI18n: () => ({
            t: vi.fn().mockReturnValue("test"),
        }),
    };
});
vi.mock("../helpers/ui-helpers.js", () => {
    return {
        showErrorMessage: vi.fn(),
        tryCatchLoadingWrapper: vi.fn().mockResolvedValue(undefined),
        showConfirm: vi.fn().mockResolvedValue(true),
    };
});
vi.mock("@firetable/backend", () => {
    return {
        addReservation: addReservationSpy,
        updateReservationDoc: deleteReservationSpy,
    };
});

// FIXME: fix these tests, seems like there is a bug with vitest.mock
describe.skip("useReservations", () => {
    let users: Ref<User[]>;
    const floorInstances = shallowRef<FloorViewer[]>([]);
    let eventOwner: EventOwner;
    let event: Ref<EventDoc>;
    let floor1: FloorViewer;
    const mockReservations = [];

    beforeEach(() => {
        mockReservations.length = 0;
        floorInstances.value.length = 0;
        users = ref([]);
        floor1 = createFloor("test-1");
        const floor2 = createFloor("test-2");
        floorInstances.value.push(floor1, floor2);
        eventOwner = {
            propertyId: "1",
            organisationId: "2",
            id: "3",
        };
        const doc = {
            name: "test event",
            creator: "test creator",
            date: Date.now(),
            entryPrice: 1,
            guestListLimit: 100,
            propertyId: "1",
            organisationId: "2",
        };
        event = ref<EventDoc>({
            id: "3",
            ...doc,
            _doc: doc,
        });
    });

    it("should handle reservation creation correctly", async () => {
        floor1.canvas.add(createReservedTable("table1"));
        const [table] = getTables(floor1);
        const mockReservation = createMockReservation({
            floorId: floor1.id,
            tableLabel: table.label,
        });
        mockReservations.push(mockReservation);

        const { useReservations } = await import("./useReservations");
        const { handleReservationCreation } = useReservations(
            users,
            toRef(mockReservations),
            floorInstances,
            eventOwner,
            event,
        );
        handleReservationCreation(mockReservation);

        expect(addReservationSpy).toHaveBeenCalledWith(eventOwner, mockReservation);
    });

    it("should handle reservation deletion correctly", async () => {
        floor1.canvas.add(createReservedTable("table1"));
        const [table] = getTables(floor1);
        const { useReservations } = await import("./useReservations");
        const mockReservation = createMockReservation({
            floorId: floor1.id,
            tableLabel: table.label,
            cancelled: true,
        });
        mockReservations.push(mockReservation);
        const { onDeleteReservation } = useReservations(
            users,
            toRef(mockReservations),
            floorInstances,
            eventOwner,
            event,
        );
        await onDeleteReservation(mockReservation);
        expect(deleteReservationSpy).toHaveBeenCalledWith(eventOwner, {
            clearedAt: expect.objectContaining({
                seconds: expect.any(Number),
                nanoseconds: expect.any(Number),
            }),
            id: mockReservation.id,
            status: ReservationStatus.DELETED,
        });
    });
});
