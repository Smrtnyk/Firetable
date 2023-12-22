import type { Ref } from "vue";
import type { EventDoc, ReservationDoc, User } from "@firetable/types";
import type * as backend from "@firetable/backend";
import type { MockInstance } from "vitest";
import { useReservations } from "./useReservations";
import * as uiHelpers from "../helpers/ui-helpers";
import * as authStore from "../stores/auth-store";
import { ReservationStatus } from "@firetable/types";
import { shallowRef, toRef, ref } from "vue";
import * as Backend from "@firetable/backend";
import * as Quasar from "quasar";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { FloorViewer, getTables, RectTable } from "@firetable/floor-creator";
import { uid } from "quasar";
import * as i18n from "vue-i18n";
import { NOOP } from "@firetable/utils";

function createFloor(floorName: string): FloorViewer {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const id = uid();
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
                    createReservedTable("reserved1", id).toObject(),
                ],
            },
            propertyId: "",
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

function createMockReservation(partial: Partial<ReservationDoc> = {}): ReservationDoc {
    return {
        id: "id",
        guestName: "foo",
        confirmed: false,
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
        _doc: this,
        ...partial,
    };
}

function createReservedTable(label: string, floorId: string): RectTable {
    const table = createTable(label);
    table.setReservation({
        ...createMockReservation(),
        floorId,
        tableLabel: label,
    });
    return table;
}

describe("useReservations", () => {
    let users: Ref<User[]>;
    const floorInstances = shallowRef<FloorViewer[]>([]);
    let eventOwner: backend.EventOwner;
    let event: Ref<EventDoc>;
    let floor1: FloorViewer;
    const mockReservations = [];
    let deleteReservationSpy: MockInstance;

    beforeEach(() => {
        deleteReservationSpy = vi
            .spyOn(Backend, "updateReservationDoc")
            .mockImplementation(vi.fn<any>());
        mockReservations.length = 0;
        floorInstances.value.length = 0;
        vi.spyOn(Quasar, "Dialog", "get").mockReturnValue({
            create: vi.fn(),
        });
        vi.spyOn<any, any>(i18n, "useI18n").mockReturnValue(() => {
            return {
                t: NOOP,
            };
        });
        vi.spyOn(authStore, "useAuthStore").mockReturnValue({} as any);
        users = ref([]);
        floor1 = createFloor("test-1");
        const floor2 = createFloor("test-2");
        floorInstances.value.push(floor1, floor2);
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

    it("should handle reservation creation correctly", () => {
        floor1.canvas.add(createReservedTable("table1", floor1.id));
        const [table] = getTables(floor1);
        const mockReservation = createMockReservation({
            floorId: floor1.id,
            tableLabel: table.label,
        });
        mockReservations.push(mockReservation);
        const setReservationSpy = vi.spyOn(table, "setReservation");

        const { handleReservationCreation } = useReservations(
            users,
            toRef(mockReservations),
            floorInstances,
            eventOwner,
            event,
        );
        handleReservationCreation(mockReservation);

        expect(setReservationSpy).toHaveBeenCalledWith(mockReservation);
    });

    it("should handle reservation deletion correctly", async () => {
        vi.spyOn(uiHelpers, "showConfirm").mockResolvedValue(true);
        floor1.canvas.add(createReservedTable("table1", floor1.id));
        const [table] = getTables(floor1);
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
            id: mockReservation.id,
            status: ReservationStatus.DELETED,
        });
    });
});
