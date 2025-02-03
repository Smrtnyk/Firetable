import type { QueuedReservationDoc, UserCapabilities, WalkInReservation } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import {
    ReservationState,
    ReservationStatus,
    ReservationType,
    Role,
    UserCapability,
} from "@firetable/types";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { describe, expect, it } from "vitest";

import { getLocaleForTest, renderComponent } from "../../../../test-helpers/render-component";
import ReservationGeneralInfo from "./ReservationGeneralInfo.vue";

describe("ReservationGeneralInfo", () => {
    const mockReservation: QueuedReservationDoc = {
        consumption: 50,
        creator: {
            createdAt: 1_600_000_000_000,
            email: "creator@example.com",
            id: "creator456",
            name: "Creator Name",
        },
        guestContact: "john.doe@contact.com",
        guestName: "John Doe",
        id: "reservation1",
        isVIP: true,
        numberOfGuests: 4,
        reservationNote: "Please prepare a vegan meal.",
        reservedBy: {
            email: "john.doe@example.com",
            id: "foo",
            name: "John Doe",
        },
        status: ReservationStatus.ACTIVE,
        time: "18:00",
        type: ReservationType.QUEUED,
    };

    function renderComponentWithStore(
        currentUserId: string,
        capabilitiesPartial: Partial<UserCapabilities> = {},
    ): RenderResult<any> {
        return renderComponent(
            ReservationGeneralInfo,
            { reservation: mockReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                capabilities: {
                                    [UserCapability.CAN_DELETE_RESERVATION]: true,
                                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                                    [UserCapability.CAN_RESERVE]: true,
                                    ...capabilitiesPartial,
                                },
                                email: "current.user@example.com",
                                id: currentUserId,
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );
    }

    it("renders guestName label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Name")).toBeVisible();
        await expect.element(screen.getByText(/^\s*John\s+Doe\s*$/)).toBeVisible();
    });

    it("does not render guestName section when guestName is absent", async () => {
        const reservationWithoutGuestName = { ...mockReservation, guestName: undefined };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutGuestName, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Name")).not.toBeInTheDocument();
    });

    it("renders time label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Time of arrival")).toBeVisible();
        await expect.element(screen.getByText(mockReservation.time)).toBeVisible();
    });

    it("renders numberOfGuests label and value", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Number of people")).toBeVisible();
        await expect
            .element(screen.getByText(mockReservation.numberOfGuests.toString()))
            .toBeVisible();
    });

    it("renders guestContact when present and user can see it", async () => {
        const screen = renderComponentWithStore("user123", {
            [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
        });

        await expect.element(screen.getByText(/^\s*Contact\s*$/)).toBeVisible();
        await expect.element(screen.getByText(mockReservation.guestContact!)).toBeVisible();
    });

    it("does not render guestContact when user cannot see it", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText(/^\s*Contact\s*$/)).not.toBeInTheDocument();
    });

    it("does not render guestContact when guestContact is absent", async () => {
        const reservationWithoutGuestContact = { ...mockReservation, guestContact: undefined };
        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutGuestContact, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText(/^\s*Contact\s*$/)).not.toBeInTheDocument();
    });

    it("renders consumption label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Consumption")).toBeVisible();
        await expect
            .element(screen.getByText(mockReservation.consumption.toString()))
            .toBeVisible();
    });

    it("does not render consumption section when consumption is absent", async () => {
        const reservationWithoutConsumption = { ...mockReservation, consumption: undefined };
        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutConsumption, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Consumption")).not.toBeInTheDocument();
    });

    it("renders reservationNote label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Note")).toBeVisible();
        await expect.element(screen.getByText(mockReservation.reservationNote!)).toBeVisible();
    });

    it("does not render reservationNote section when reservationNote is absent", async () => {
        const reservationWithoutNote = { ...mockReservation, reservationNote: undefined };
        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutNote, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Note")).not.toBeInTheDocument();
        await expect
            .element(screen.getByText(mockReservation.reservationNote!))
            .not.toBeInTheDocument();
    });

    it("renders reservedBy label and value when not a walk-in reservation", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Reserved by")).toBeVisible();
        await expect.element(screen.getByText("John Doe - john.doe@example.com")).toBeVisible();
    });

    it("does not render reservedBy section when it is a walk-in reservation", async () => {
        const walkInReservation: WalkInReservation = {
            ...mockReservation,
            arrived: true,
            floorId: "floor1",
            state: ReservationState.ARRIVED,
            tableLabel: "Table 1",
            type: ReservationType.WALK_IN,
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: walkInReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Reserved by")).not.toBeInTheDocument();
        await expect
            .element(screen.getByText("John Doe - john.doe@example.com"))
            .not.toBeInTheDocument();
    });

    it("renders reservedBy with correct format when email does not start with 'social'", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("John Doe - john.doe@example.com")).toBeVisible();
    });

    it("renders creator label and value when creator exists and user can see it", async () => {
        const screen = renderComponentWithStore("user123", {
            [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        });

        await expect.element(screen.getByText(/^\s*Creator\s*$/)).toBeVisible();
        await expect
            .element(screen.getByText(/^\s*Creator\s+Name\s*-\s*creator@example\.com\s*$/))
            .toBeVisible();
    });

    it("does not render creator section when user cannot see reservation creator", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText(/^\s*Creator\s*$/)).not.toBeInTheDocument();
        await expect
            .element(screen.getByText("Creator Name - creator@example.com"))
            .not.toBeInTheDocument();
    });

    it("renders createdAt label and formatted date when present", async () => {
        const screen = renderComponentWithStore("user123", {
            [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        });

        await expect.element(screen.getByText("Created at")).toBeVisible();
        await expect
            .element(
                screen.getByText(
                    formatEventDate(
                        1_600_000_000_000,
                        getLocaleForTest().value,
                        getDefaultTimezone(),
                    ),
                ),
            )
            .toBeVisible();
    });

    it("handles missing fields gracefully", async () => {
        const incompleteReservation: QueuedReservationDoc = {
            consumption: 0,
            creator: {
                createdAt: 1_680_000_000_000,
                email: "",
                id: "creator789",
                name: "",
            },
            guestContact: "",
            guestName: "",
            id: "reservation2",
            isVIP: false,
            numberOfGuests: 2,
            reservationNote: "",
            reservedBy: {
                email: "",
                id: "reservedBy123",
                name: "Reserved By",
            },
            status: ReservationStatus.DELETED,
            time: "14:00",
            type: ReservationType.QUEUED,
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: incompleteReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            canSeeGuestContact: false,
                            canSeeReservationCreator: false,
                            user: {
                                capabilities: {},
                                email: "current.user@example.com",
                                id: "user123",
                                name: "Current User",
                                role: Role.MANAGER,
                            },
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Name")).not.toBeInTheDocument();
        await expect.element(screen.getByText("Number of people")).toBeVisible();
        await expect
            .element(screen.getByText(incompleteReservation.numberOfGuests.toString()))
            .toBeVisible();

        await expect.element(screen.getByText(/^\s*Contact\s*$/)).not.toBeInTheDocument();
        await expect.element(screen.getByText("Consumption")).not.toBeInTheDocument();
        await expect.element(screen.getByText("Note")).not.toBeInTheDocument();
    });
});
