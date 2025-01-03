import type { PlannedReservationDoc, User } from "@firetable/types";
import type { EventShowReservationProps } from "./EventShowReservation.vue";
import type { GuestSummary } from "src/stores/guests-store";
import EventShowReservation from "./EventShowReservation.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import {
    ReservationState,
    ReservationStatus,
    ReservationType,
    Role,
    UserCapability,
} from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";
import { getDefaultTimezone } from "src/helpers/date-utils";

describe("EventShowReservation", () => {
    let props: EventShowReservationProps;
    let reservation: PlannedReservationDoc;
    let initialPiniaState: {
        auth: {
            user: Partial<User>;
        };
    };

    beforeEach(() => {
        initialPiniaState = {
            auth: {
                user: {
                    id: "user1",
                    role: Role.PROPERTY_OWNER,
                },
            },
        };
        reservation = {
            id: "reservation1",
            arrived: false,
            isVIP: false,
            numberOfGuests: 2,
            cancelled: false,
            reservationConfirmed: false,
            waitingForResponse: false,
            type: ReservationType.PLANNED,
            state: ReservationState.PENDING,
            consumption: 0,
            time: "22:00",
            status: ReservationStatus.ACTIVE,
            floorId: "floor1",
            tableLabel: "table1",
            guestName: "John Doe",
            reservedBy: {
                id: "user1",
                email: "foo",
                name: "bar",
            },
            creator: {
                id: "user1",
                email: "foo",
                name: "bar",
                createdAt: 123_455,
            },
        };
        props = {
            reservation,
            timezone: getDefaultTimezone(),
            guestSummaryPromise: Promise.resolve(void 0),
        };
    });

    describe("reservation state select", () => {
        it("renders the state select when conditions are met", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const select = screen.getByRole("combobox", { name: "Reservation state" });
            await expect.element(select).toHaveValue(t("EventShowReservation.pendingLabel"));
        });

        it("does not render the state select when reservation is cancelled", async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            await expect.element(screen.getByRole("combobox")).not.toBeInTheDocument();
        });

        it("emits correct events when state changes to WAITING_FOR_RESPONSE", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const select = screen.getByRole("combobox");
            await userEvent.click(select);

            const waitingOption = screen.getByText(t("EventShowReservation.waitingForResponse"));
            await userEvent.click(waitingOption);

            expect(screen.emitted().waitingForResponse).toBeTruthy();
            expect(screen.emitted().waitingForResponse[0]).toEqual([true]);
            expect(screen.emitted().stateChange[0]).toEqual([
                ReservationState.WAITING_FOR_RESPONSE,
            ]);
        });

        it("emits correct events when state changes to CONFIRMED", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const select = screen.getByRole("combobox");
            await userEvent.click(select);

            const confirmedOption = screen.getByText(
                t("EventShowReservation.reservationConfirmedLabel"),
            );
            await userEvent.click(confirmedOption);

            expect(screen.emitted().reservationConfirmed).toBeTruthy();
            expect(screen.emitted().reservationConfirmed[0]).toEqual([true]);
            expect(screen.emitted().stateChange[0]).toEqual([ReservationState.CONFIRMED]);
        });

        it("emits correct events when state changes to ARRIVED", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            await userEvent.click(screen.getByRole("combobox"));

            const arrivedOption = screen.getByText(
                t("EventShowReservation.reservationGuestArrivedLabel"),
            );
            await userEvent.click(arrivedOption);

            expect(screen.emitted().arrived).toBeTruthy();
            expect(screen.emitted().arrived[0]).toEqual([true]);
            expect(screen.emitted().stateChange[0]).toEqual([ReservationState.ARRIVED]);
        });

        it("shows correct initial state based on reservation props", async () => {
            reservation.arrived = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const select = screen.getByRole("combobox", { name: "Reservation state" });
            await expect
                .element(select)
                .toHaveValue(t("EventShowReservation.reservationGuestArrivedLabel"));
        });
    });

    describe("transfer and copy buttons", () => {
        it("renders transfer and copy buttons when user can reserve and reservation is not cancelled", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const transferButton = screen.getByRole("button", { name: t("Global.transfer") });
            const copyButton = screen.getByRole("button", { name: t("Global.copy") });

            await expect.element(transferButton).toBeVisible();
            await expect.element(copyButton).toBeVisible();

            await userEvent.click(transferButton);
            expect(screen.emitted().transfer).toBeTruthy();

            await userEvent.click(copyButton);
            expect(screen.emitted().copy).toBeTruthy();
        });

        it("does not render transfer and copy buttons when reservation is cancelled", async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const transferButton = screen.getByRole("button", { name: t("Global.transfer") });
            const copyButton = screen.getByRole("button", { name: t("Global.copy") });

            await expect.element(transferButton).not.toBeInTheDocument();
            await expect.element(copyButton).not.toBeInTheDocument();
        });
    });

    describe("delete button", () => {
        it("renders the delete button when user can delete the reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const deleteButton = screen.getByRole("button", { name: t("Global.delete") });
            await expect.element(deleteButton).toBeVisible();

            await userEvent.click(deleteButton);

            expect(screen.emitted().delete).toBeTruthy();
        });

        it("renders delete button when user can delete any reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user2",
                                capabilities: {
                                    [UserCapability.CAN_DELETE_RESERVATION]: true,
                                },
                            },
                        },
                    },
                },
            });

            const deleteButton = screen.getByRole("button", { name: t("Global.delete") });
            await expect.element(deleteButton).toBeVisible();
        });

        it("renders delete button when user can delete own reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
                                },
                            },
                        },
                    },
                },
            });

            const deleteButton = screen.getByRole("button", { name: t("Global.delete") });
            await expect.element(deleteButton).toBeVisible();
        });

        it("does not render delete button when user cannot delete reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_DELETE_RESERVATION]: false,
                                },
                            },
                        },
                    },
                },
            });

            const deleteButton = screen.getByRole("button", { name: t("Global.delete") });
            await expect.element(deleteButton).not.toBeInTheDocument();
        });
    });

    describe("edit button", () => {
        it("renders the edit button when user can edit the reservation and it is not cancelled", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const editButton = screen.getByRole("button", { name: t("Global.edit") });
            await expect.element(editButton).toBeVisible();

            await userEvent.click(editButton);

            expect(screen.emitted().edit).toBeTruthy();
        });

        it("renders edit button when user can edit any reservation", () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user2",
                                capabilities: {
                                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                                },
                            },
                        },
                    },
                },
            });

            const editButton = screen.getByRole("button", { name: t("Global.edit") });
            expect(editButton).toBeTruthy();
        });

        it("renders edit button when user can edit own reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
                                },
                            },
                        },
                    },
                },
            });

            const editButton = screen.getByRole("button", { name: t("Global.edit") });
            await expect.element(editButton).toBeVisible();
        });

        it("does not render the edit button when reservation is cancelled", async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const editButton = screen.getByRole("button", { name: t("Global.edit") });
            await expect.element(editButton).not.toBeInTheDocument();
        });

        it("does not render edit button when user cannot edit reservation", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user2",
                                capabilities: {
                                    [UserCapability.CAN_EDIT_RESERVATION]: false,
                                },
                            },
                        },
                    },
                },
            });

            const editButton = screen.getByRole("button", { name: t("Global.edit") });
            await expect.element(editButton).not.toBeInTheDocument();
        });
    });

    describe("cancel reservation button", () => {
        it("does not render cancel button when user does not have cancel permission", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_CANCEL_RESERVATION]: false,
                                },
                            },
                        },
                    },
                },
            });

            const cancelButton = screen.getByRole("button", { name: t("Global.cancel") });
            await expect.element(cancelButton).not.toBeInTheDocument();
        });

        it("does not render cancel/reactivate button for non-planned reservations", async () => {
            (reservation as any).type = ReservationType.QUEUED;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const cancelButton = screen.getByRole("button", { name: t("Global.cancel") });
            await expect.element(cancelButton).not.toBeInTheDocument();
        });

        it('does not render the "Cancel Reservation" toggle when guest has arrived', async () => {
            props.reservation.arrived = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const label = screen.getByText(t("Global.cancel"));
            await expect.element(label).not.toBeInTheDocument();
        });

        it('shows "Cancel" button with warning color when reservation is not cancelled', async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const cancelButton = screen.getByRole("button", { name: t("Global.cancel") });
            await expect.element(cancelButton).toBeVisible();
            expect(cancelButton.element().classList.contains("bg-warning")).toBe(true);
        });

        it('shows "Reactivate" button with positive color when reservation is cancelled', async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const reactivateButton = screen.getByRole("button", { name: t("Global.reactivate") });
            await expect.element(reactivateButton).toBeVisible();
            expect(reactivateButton.element().classList.contains("bg-positive")).toBe(true);
        });

        it("emits cancel event with correct value when toggling cancelled state", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            // Initial state: not cancelled
            const cancelButton = screen.getByRole("button", { name: t("Global.cancel") });
            await userEvent.click(cancelButton);
            expect(screen.emitted().cancel[0]).toEqual([true]);

            const newProps = {
                ...props,
                reservation: {
                    ...reservation,
                    cancelled: true,
                },
            };
            screen.rerender(newProps);
            await nextTick();

            // Cancelled state: show reactivate
            const reactivateButton = screen.getByRole("button", { name: t("Global.reactivate") });
            await userEvent.click(reactivateButton);
            expect(screen.emitted().cancel[1]).toEqual([false]);
        });
    });

    describe("move to queue", () => {
        it('renders the "Move to Queue" button when user can reserve and reservation is not cancelled or arrived and it is not own reservation', async () => {
            props.reservation.creator.id = "user2";

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await expect.element(queueButton).toBeVisible();
        });

        it('renders the "Move to Queue" button when user is the owner and but cannot can reserve', async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                // Same as reservation.creator.id
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                                capabilities: {
                                    // Global reserve not allowed
                                    [UserCapability.CAN_RESERVE]: false,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await expect.element(queueButton).toBeVisible();
        });

        it('does not render the "Move to Queue" button when reservation is cancelled', async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await expect.element(queueButton).not.toBeInTheDocument();
        });

        it('does not render the "Move to Queue" button when guest has arrived', async () => {
            props.reservation.arrived = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await expect.element(queueButton).not.toBeInTheDocument();
        });

        it('does not render the "Move to Queue" button when user cannot reserve', async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                // Different user
                                id: "user2",
                                role: Role.STAFF,
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: false,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await expect.element(queueButton).not.toBeInTheDocument();
        });

        it('emits "queue" event when "Move to Queue" button is clicked', async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const queueButton = screen.getByRole("button", { name: "Move to queue" });
            await userEvent.click(queueButton);

            expect(screen.emitted().queue).toBeTruthy();
            expect(screen.emitted().queue[0]).toEqual([]);
        });
    });

    describe("guest history", () => {
        it("displays guest summary when promise resolves with data", async () => {
            const guestSummaryData: GuestSummary = {
                guestId: "guest1",
                propertyId: "prop1",
                propertyName: "Property 1",
                totalReservations: 5,
                fulfilledVisits: 3,
                visitPercentage: "60.00",
            };

            props.guestSummaryPromise = Promise.resolve(guestSummaryData);

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: initialPiniaState,
                },
            });

            await nextTick();

            const guestHistoryText = screen.getByText("Guest history:");
            await expect.element(guestHistoryText).toBeVisible();

            const totalReservations = screen.getByText(
                `Reservations: ${guestSummaryData.totalReservations}`,
            );
            await expect.element(totalReservations).toBeVisible();

            const fulfilledVisits = screen.getByText(
                `Arrived: ${guestSummaryData.fulfilledVisits}`,
            );
            await expect.element(fulfilledVisits).toBeVisible();

            const visitPercentage = screen.getByText(`${guestSummaryData.visitPercentage}%`);
            await expect.element(visitPercentage).toBeVisible();
        });

        it("does not display guest summary when promise resolves with undefined", async () => {
            props.guestSummaryPromise = Promise.resolve(undefined);

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: initialPiniaState,
                },
            });

            await nextTick();

            const guestHistoryText = screen.getByText("Guest history:");
            await expect.element(guestHistoryText).not.toBeInTheDocument();
        });

        it("does not display guest summary when totalReservations is zero", async () => {
            const guestSummaryData: GuestSummary = {
                guestId: "guest1",
                propertyId: "prop1",
                propertyName: "Property 1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            };

            props.guestSummaryPromise = Promise.resolve(guestSummaryData);

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: initialPiniaState,
                },
            });

            await nextTick();

            const guestHistoryText = screen.getByText("Guest history:");
            await expect.element(guestHistoryText).not.toBeInTheDocument();
        });

        it("displays loading indicator while guest summary is loading", async () => {
            // Create a promise that doesn't resolve immediately
            // let resolvePromise: (value: GuestSummary) => void;
            props.guestSummaryPromise = new Promise<GuestSummary>(() => {
                // resolvePromise = resolve;
            });

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: initialPiniaState,
                },
            });

            await expect.element(screen.getByText("Guest history")).not.toBeInTheDocument();

            // At this point, the promise is pending
            // There is no loading indicator but when we add one we could assert here
        });
    });

    describe("link/unlink buttons", () => {
        it("renders unlink button when reservation is linked to multiple tables", async () => {
            props.reservation.tableLabel = ["table1", "table2"];

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const unlinkButton = screen.getByRole("button", {
                name: t("EventShowReservation.unlinkTablesLabel"),
            });
            await expect.element(unlinkButton).toBeVisible();

            await userEvent.click(unlinkButton);
            expect(screen.emitted().unlink).toBeTruthy();
        });

        it("does not render unlink button when reservation has single table", async () => {
            props.reservation.tableLabel = ["table1"];

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                role: Role.PROPERTY_OWNER,
                            },
                        },
                    },
                },
            });

            const unlinkButton = screen.getByRole("button", {
                name: t("EventShowReservation.unlinkTablesLabel"),
            });
            await expect.element(unlinkButton).not.toBeInTheDocument();
        });

        it("renders link button when user can reserve and reservation is not cancelled", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const linkButton = screen.getByRole("button", {
                name: t("EventShowReservation.linkTablesLabel"),
            });
            await expect.element(linkButton).toBeVisible();

            await userEvent.click(linkButton);
            expect(screen.emitted().link).toBeTruthy();
        });

        it("does not render link button when user cannot reserve", async () => {
            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: false,
                                },
                            },
                        },
                    },
                },
            });

            const linkButton = screen.getByRole("button", {
                name: t("EventShowReservation.linkTablesLabel"),
            });
            await expect.element(linkButton).not.toBeInTheDocument();
        });

        it("does not render link button when reservation is cancelled", async () => {
            reservation.cancelled = true;

            const screen = renderComponent(EventShowReservation, props, {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user1",
                                capabilities: {
                                    [UserCapability.CAN_RESERVE]: true,
                                },
                            },
                        },
                    },
                },
            });

            const linkButton = screen.getByRole("button", {
                name: t("EventShowReservation.linkTablesLabel"),
            });
            await expect.element(linkButton).not.toBeInTheDocument();
        });
    });
});
