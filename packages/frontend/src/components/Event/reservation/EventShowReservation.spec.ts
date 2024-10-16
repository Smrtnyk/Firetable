import type { PlannedReservationDoc } from "@firetable/types";
import EventShowReservation from "./EventShowReservation.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { ReservationStatus, ReservationType, Role, UserCapability } from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("EventShowReservation", () => {
    let props: { reservation: PlannedReservationDoc };

    beforeEach(() => {
        const reservation: PlannedReservationDoc = {
            id: "reservation1",
            arrived: false,
            isVIP: false,
            numberOfGuests: 2,
            cancelled: false,
            reservationConfirmed: false,
            waitingForResponse: false,
            type: ReservationType.PLANNED,
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
        props = { reservation };
    });

    it('renders the "Waiting for Response" toggle when conditions are met', async () => {
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

        const toggle = screen.getByText(t("EventShowReservation.waitingForResponse"));
        await expect.element(toggle).toBeVisible();

        await userEvent.click(toggle);

        expect(screen.emitted().waitingForResponse).toBeTruthy();
        expect(screen.emitted().waitingForResponse[0]).toEqual([true]);
    });

    it('does not render the "Waiting for Response" toggle when reservation is confirmed', async () => {
        props.reservation.reservationConfirmed = true;

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

        const label = screen.getByText(t("EventShowReservation.waitingForResponse"));
        await expect.element(label).not.toBeInTheDocument();
    });

    it('renders the "Reservation Confirmed" toggle when conditions are met', async () => {
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

        const toggle = screen.getByText(t("EventShowReservation.reservationConfirmedLabel"));
        await expect.element(toggle).toBeVisible();

        await userEvent.click(toggle);

        expect(screen.emitted().reservationConfirmed).toBeTruthy();
        expect(screen.emitted().reservationConfirmed[0]).toEqual([true]);
    });

    it('renders the "Guest Arrived" toggle when conditions are met', async () => {
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

        const toggle = screen.getByText(t("EventShowReservation.guestArrivedLabel"));
        await expect.element(toggle).toBeVisible();

        await userEvent.click(toggle);

        expect(screen.emitted().arrived).toBeTruthy();
        expect(screen.emitted().arrived[0]).toEqual([true]);
    });

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

    it("does not render the edit button when reservation is cancelled", async () => {
        props.reservation.cancelled = true;

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
        props.reservation.cancelled = true;

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
            props.reservation.cancelled = true;

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
});
