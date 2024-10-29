import type { QueuedReservationDoc, UserCapabilities, WalkInReservation } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import ReservationGeneralInfo from "./ReservationGeneralInfo.vue";
import { renderComponent, locale } from "../../../../test-helpers/render-component";
import { ReservationStatus, ReservationType, Role, UserCapability } from "@firetable/types";
import { formatEventDate } from "src/helpers/date-utils";
import { describe, expect, it } from "vitest";

describe("ReservationGeneralInfo", () => {
    const mockReservation: QueuedReservationDoc = {
        id: "reservation1",
        guestName: "John Doe",
        consumption: 50,
        isVIP: true,
        numberOfGuests: 4,
        time: "18:00",
        guestContact: "john.doe@contact.com",
        reservationNote: "Please prepare a vegan meal.",
        reservedBy: {
            id: "foo",
            name: "John Doe",
            email: "john.doe@example.com",
        },
        creator: {
            id: "creator456",
            email: "creator@example.com",
            name: "Creator Name",
            createdAt: 1_600_000_000_000,
        },
        status: ReservationStatus.ACTIVE,
        type: ReservationType.QUEUED,
    };

    function renderComponentWithStore(
        currentUserId: string,
        capabilitiesPartial: Partial<UserCapabilities> = {},
    ): RenderResult<any> {
        return renderComponent(
            ReservationGeneralInfo,
            { reservation: mockReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: currentUserId,
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {
                                    [UserCapability.CAN_DELETE_RESERVATION]: true,
                                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                                    [UserCapability.CAN_RESERVE]: true,
                                    ...capabilitiesPartial,
                                },
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
            { reservation: reservationWithoutGuestName },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
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
            { reservation: reservationWithoutGuestContact },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
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
            { reservation: reservationWithoutConsumption },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
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
            { reservation: reservationWithoutNote },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
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
            type: ReservationType.WALK_IN,
            arrived: true,
            tableLabel: "Table 1",
            floorId: "floor1",
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: walkInReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: true,
                            canSeeReservationCreator: true,
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
            .element(screen.getByText(formatEventDate(1_600_000_000_000, locale.value, null)))
            .toBeVisible();
    });

    it("handles missing fields gracefully", async () => {
        const incompleteReservation: QueuedReservationDoc = {
            type: ReservationType.QUEUED,
            id: "reservation2",
            guestName: "",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "14:00",
            guestContact: "",
            reservationNote: "",
            reservedBy: {
                id: "reservedBy123",
                name: "Reserved By",
                email: "",
            },
            creator: {
                id: "creator789",
                email: "",
                name: "",
                createdAt: 1_680_000_000_000,
            },
            status: ReservationStatus.DELETED,
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: incompleteReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user123",
                                email: "current.user@example.com",
                                name: "Current User",
                                role: Role.MANAGER,
                                capabilities: {},
                            },
                            canSeeGuestContact: false,
                            canSeeReservationCreator: false,
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
