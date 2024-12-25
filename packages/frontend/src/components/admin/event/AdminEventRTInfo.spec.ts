import type { AdminEventRTInfoProps } from "src/components/admin/event/AdminEventRTInfo.vue";
import type { PlannedReservationDoc } from "@firetable/types";
import AdminEventRTInfo from "./AdminEventRTInfo.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { FloorElementTypes } from "@firetable/floor-creator";

describe("AdminEventRTInfo.spec", () => {
    let props: AdminEventRTInfoProps;

    beforeEach(() => {
        const tableObject = {
            type: FloorElementTypes.RECT_TABLE,
            left: 100,
            top: 100,
            width: 50,
            height: 50,
            label: "T1",
            capacity: 4,
            angle: 0,
            isCircular: false,
            isLocked: false,
        };

        const floorJsonData = {
            objects: [
                { ...tableObject, id: "t1" },
                { ...tableObject, id: "t2", left: 200 },
                { ...tableObject, id: "t3", left: 300 },
            ],
        };

        props = {
            floors: [
                {
                    id: "floor1",
                    name: "Main Floor",
                    width: 800,
                    height: 600,
                    propertyId: "prop1",
                    json: JSON.stringify(floorJsonData),
                },
                {
                    id: "floor2",
                    name: "Main Floor_copy",
                    width: 800,
                    height: 600,
                    propertyId: "prop1",
                    json: JSON.stringify({
                        objects: [
                            { ...tableObject, id: "t4", left: 400 },
                            { ...tableObject, id: "t5", left: 500 },
                        ],
                    }),
                },
                {
                    id: "floor3",
                    name: "Outdoor",
                    width: 800,
                    height: 600,
                    propertyId: "prop1",
                    json: JSON.stringify({
                        objects: [
                            { ...tableObject, id: "t6", left: 100 },
                            { ...tableObject, id: "t7", left: 200 },
                            { ...tableObject, id: "t8", left: 300 },
                        ],
                    }),
                },
            ],
            activeReservations: [
                createTestReservation({
                    arrived: true,
                    guestContact: "test@email.com",
                    isVIP: true,
                    numberOfGuests: 4,
                    consumption: 100,
                }),
                createTestReservation({
                    arrived: true,
                    numberOfGuests: 2,
                    consumption: 50,
                }),
                createTestReservation({
                    guestContact: "guest@email.com",
                    numberOfGuests: 3,
                }),
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
            floors: [],
            activeReservations: [],
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
        id: `res${Math.random()}`,
        type: ReservationType.PLANNED,
        state: ReservationState.PENDING,
        guestName: "Guest",
        arrived: false,
        guestContact: "",
        isVIP: false,
        numberOfGuests: 0,
        consumption: 0,
        reservedBy: expect.anything(),
        creator: expect.anything(),
        reservationConfirmed: true,
        cancelled: false,
        tableLabel: "t1",
        floorId: "floor1",
        time: "13:00",
        status: ReservationStatus.ACTIVE,
        ...params,
    };
}
