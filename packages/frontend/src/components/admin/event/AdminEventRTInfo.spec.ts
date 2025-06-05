import type { PlannedReservationDoc } from "@firetable/types";
import type { AdminEventRTInfoProps } from "src/components/admin/event/AdminEventRTInfo.vue";

import { FloorElementTypes } from "@firetable/floor-creator";
import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";

import { renderComponent } from "../../../../test-helpers/render-component";
import AdminEventRTInfo from "./AdminEventRTInfo.vue";

describe("AdminEventRTInfo.spec", () => {
    let props: AdminEventRTInfoProps;

    beforeEach(() => {
        const tableObject = {
            angle: 0,
            capacity: 4,
            height: 50,
            isCircular: false,
            isLocked: false,
            label: "T1",
            left: 100,
            top: 100,
            type: FloorElementTypes.RECT_TABLE,
            width: 50,
        };

        const floorJsonData = {
            objects: [
                { ...tableObject, id: "t1" },
                { ...tableObject, id: "t2", left: 200 },
                { ...tableObject, id: "t3", left: 300 },
            ],
        };

        props = {
            activeReservations: [
                createTestReservation({
                    arrived: true,
                    consumption: 100,
                    guestContact: "test@email.com",
                    isVIP: true,
                    numberOfGuests: 4,
                }),
                createTestReservation({
                    arrived: true,
                    consumption: 50,
                    numberOfGuests: 2,
                }),
                createTestReservation({
                    guestContact: "guest@email.com",
                    numberOfGuests: 3,
                }),
            ],
            floors: [
                {
                    height: 600,
                    id: "floor1",
                    json: JSON.stringify(floorJsonData),
                    name: "Main Floor",
                    propertyId: "prop1",
                    width: 800,
                },
                {
                    height: 600,
                    id: "floor2",
                    json: JSON.stringify({
                        objects: [
                            { ...tableObject, id: "t4", left: 400 },
                            { ...tableObject, id: "t5", left: 500 },
                        ],
                    }),
                    name: "Main Floor_copy",
                    propertyId: "prop1",
                    width: 800,
                },
                {
                    height: 600,
                    id: "floor3",
                    json: JSON.stringify({
                        objects: [
                            { ...tableObject, id: "t6", left: 100 },
                            { ...tableObject, id: "t7", left: 200 },
                            { ...tableObject, id: "t8", left: 300 },
                        ],
                    }),
                    name: "Outdoor",
                    propertyId: "prop1",
                    width: 800,
                },
            ],
            returningGuests: [{ id: "guest1" }, { id: "guest2" }],
        };
    });

    it("correctly calculates occupancy stats", async () => {
        const screen = renderComponent<AdminEventRTInfoProps>(AdminEventRTInfo, props);

        // There are 6 unique tables (3 from Main Floor, 3 from Outdoor)
        // 2 reservations have arrived out of 6 total tables
        await expect.element(screen.getByLabelText("occupancy rate")).toHaveTextContent("33.3%");
        await expect
            .element(screen.getByLabelText("tables occupied"))
            .toHaveTextContent("2 / 6 tables");
        await expect
            .element(screen.getByLabelText("pending reservations"))
            .toHaveTextContent("1 pending");
    });

    it("displays guest statistics accurately", async () => {
        const screen = renderComponent<AdminEventRTInfoProps>(AdminEventRTInfo, props);

        // Total guests = 9 (4 + 2 + 3)
        await expect.element(screen.getByLabelText("total guests")).toHaveTextContent("9");
        // 2 out of 9 guests have contacts = 22.2%
        await expect
            .element(screen.getByLabelText("guest contact rate"))
            .toHaveTextContent("22.2% with contacts");
    });

    it("shows additional metrics correctly", async () => {
        const screen = renderComponent<AdminEventRTInfoProps>(AdminEventRTInfo, props);

        await expect.element(screen.getByLabelText("vip guest count")).toHaveTextContent("1");
        await expect.element(screen.getByLabelText("returning guest count")).toHaveTextContent("2");
        await expect
            .element(screen.getByLabelText("average consumption"))
            .toHaveTextContent("50.00");
    });

    it("handles edge cases gracefully", async () => {
        // Empty data
        const screen = renderComponent<AdminEventRTInfoProps>(AdminEventRTInfo, {
            activeReservations: [],
            floors: [],
            returningGuests: [],
        });

        await expect.element(screen.getByLabelText("occupancy rate")).toHaveTextContent("0.0%");
        await expect
            .element(screen.getByLabelText("tables occupied"))
            .toHaveTextContent("0 / 0 tables");
        await expect
            .element(screen.getByLabelText("pending reservations"))
            .toHaveTextContent("0 pending");
        await expect.element(screen.getByLabelText("vip guest count")).toHaveTextContent("0");
        await expect.element(screen.getByLabelText("returning guest count")).toHaveTextContent("0");
        await expect
            .element(screen.getByLabelText("average consumption"))
            .toHaveTextContent("0.00");
    });
});

function createTestReservation(params: Partial<PlannedReservationDoc> = {}): PlannedReservationDoc {
    return {
        arrived: false,
        cancelled: false,
        consumption: 0,
        creator: expect.anything() as any,
        floorId: "floor1",
        guestContact: "",
        guestName: "Guest",
        id: `res${Math.random()}`,
        isVIP: false,
        numberOfGuests: 0,
        reservationConfirmed: true,
        reservedBy: expect.anything() as any,
        state: ReservationState.PENDING,
        status: ReservationStatus.ACTIVE,
        tableLabel: "t1",
        time: "13:00",
        type: ReservationType.PLANNED,
        ...params,
    };
}
