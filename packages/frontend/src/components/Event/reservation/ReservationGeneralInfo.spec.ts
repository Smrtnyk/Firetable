import type { QueuedReservationDoc, UserCapabilities } from "@firetable/types";
import ReservationGeneralInfo from "./ReservationGeneralInfo.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { formatEventDate } from "../../../helpers/date-utils.js";
import { ReservationType, Role, UserCapability } from "@firetable/types";
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
            name: "John Doe",
            email: "john.doe@example.com",
        },
        creator: {
            id: "creator456",
            email: "creator@example.com",
            name: "Creator Name",
            createdAt: {
                toMillis: () => 1_600_000_000_000,
            },
        },
        date: 1_680_000_000_000,
        status: 1,
    };

    function renderComponentWithStore(
        currentUserId: string,
        capabilitiesPartial: Partial<UserCapabilities> = {},
    ) {
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

    it("does not render guestName section when guestName is absent", () => {
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

        expect(screen.getByText("Name").query()).toBeNull();
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
        await expect.element(screen.getByText(mockReservation.guestContact)).toBeVisible();
    });

    it("does not render guestContact when user cannot see it", () => {
        const screen = renderComponentWithStore("user123");

        expect(screen.getByText(/^\s*Contact\s*$/).query()).toBeNull();
    });

    it("does not render guestContact when guestContact is absent", () => {
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

        expect(screen.getByText(/^\s*Contact\s*$/).query()).toBeNull();
    });

    it("renders consumption label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Consumption")).toBeVisible();
        await expect
            .element(screen.getByText(mockReservation.consumption.toString()))
            .toBeVisible();
    });

    it("does not render consumption section when consumption is absent", () => {
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

        expect(screen.getByText("Consumption").query()).toBeNull();
    });

    it("renders reservationNote label and value when present", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Note")).toBeVisible();
        await expect.element(screen.getByText(mockReservation.reservationNote)).toBeVisible();
    });

    it("does not render reservationNote section when reservationNote is absent", () => {
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

        expect(screen.getByText("Note").query()).toBeNull();
        expect(screen.getByText(mockReservation.reservationNote).query()).toBeNull();
    });

    it("renders reservedBy label and value when not a walk-in reservation", async () => {
        const screen = renderComponentWithStore("user123");

        await expect.element(screen.getByText("Reserved by")).toBeVisible();
        await expect.element(screen.getByText("John Doe - john.doe@example.com")).toBeVisible();
    });

    it("does not render reservedBy section when it is a walk-in reservation", () => {
        const walkInReservation: QueuedReservationDoc = {
            ...mockReservation,
            type: ReservationType.WALK_IN,
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

        expect(screen.getByText("Reserved by").query()).toBeNull();
        expect(screen.getByText("John Doe - john.doe@example.com").query()).toBeNull();
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

    it("does not render creator section when user cannot see reservation creator", () => {
        const screen = renderComponentWithStore("user123");

        expect(screen.getByText(/^\s*Creator\s*$/).query()).toBeNull();
        expect(screen.getByText("Creator Name - creator@example.com").query()).toBeNull();
    });

    it("renders createdAt label and formatted date when present", async () => {
        const screen = renderComponentWithStore("user123", {
            [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
        });

        await expect.element(screen.getByText("Created at")).toBeVisible();
        await expect
            .element(screen.getByText(formatEventDate(1_600_000_000_000, null)))
            .toBeVisible();
    });

    it("does not render createdAt section when createdAt is absent", () => {
        const reservationWithoutCreatedAt: QueuedReservationDoc = {
            ...mockReservation,
            creator: {
                ...mockReservation.creator,
                createdAt: undefined,
            },
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutCreatedAt },
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

        expect(screen.getByText("Created at").query()).toBeNull();
        expect(screen.getByText(formatEventDate(1_600_000_000_000, null)).query()).toBeNull();
    });

    it("does not render creator section when creator is absent", () => {
        const reservationWithoutCreator: QueuedReservationDoc = {
            ...mockReservation,
            creator: undefined,
        };

        const screen = renderComponent(
            ReservationGeneralInfo,
            { reservation: reservationWithoutCreator },
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

        expect(screen.getByText(/^\s*Creator\s*$/).query()).toBeNull();
        expect(screen.getByText("Creator Name - creator@example.com").query()).toBeNull();
        expect(screen.getByText("Created at").query()).toBeNull();
        expect(screen.getByText(formatEventDate(1_600_000_000_000, null)).query()).toBeNull();
    });

    it("handles missing fields gracefully", async () => {
        const incompleteReservation: QueuedReservationDoc = {
            type: ReservationType.QUEUED,
            id: "reservation2",
            guestName: "",
            consumption: undefined,
            isVIP: false,
            numberOfGuests: 2,
            time: "14:00",
            guestContact: undefined,
            reservationNote: undefined,
            reservedBy: {
                name: "Reserved By",
                email: "",
            },
            creator: {
                id: "creator789",
                email: "",
                name: "",
            },
            date: 1_680_000_000_000,
            status: 2,
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

        expect(screen.getByText("Name").query()).toBeNull();
        await expect.element(screen.getByText("Number of people")).toBeVisible();
        await expect
            .element(screen.getByText(incompleteReservation.numberOfGuests.toString()))
            .toBeVisible();

        expect(screen.getByText(/^\s*Contact\s*$/).query()).toBeNull();
        expect(screen.getByText("Consumption").query()).toBeNull();
        expect(screen.getByText("Note").query()).toBeNull();
    });
});
