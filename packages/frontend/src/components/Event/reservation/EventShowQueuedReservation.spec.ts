import type { QueuedReservationDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { ReservationStatus, ReservationType, Role } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { getDefaultTimezone } from "src/helpers/date-utils";
import { useAuthStore } from "src/stores/auth-store";
import { describe, expect, it } from "vitest";

import { renderComponent } from "../../../../test-helpers/render-component";
import EventShowQueuedReservation from "./EventShowQueuedReservation.vue";

describe("EventShowQueuedReservation", () => {
    const mockReservation: QueuedReservationDoc = {
        consumption: 50,
        creator: {
            createdAt: 1_600_000_000_000,
            email: "creator@example.com",
            id: "creator456",
            name: "Creator Name",
        },
        guestName: "John Doe",
        id: "reservation1",
        isVIP: true,
        numberOfGuests: 4,
        reservedBy: {
            email: "john.doe@example.com",
            id: "user123",
            name: "John Doe",
        },
        status: ReservationStatus.ACTIVE,
        time: "18:00",
        type: ReservationType.QUEUED,
    };

    /**
     * Helper function to render the component with specific Pinia store state.
     *
     * @param canReserve - Whether the user has global reserve permissions.
     * @param currentUserId - The ID of the current user.
     * @returns The render result
     */
    function renderComponentWithStore(
        canReserve: boolean,
        currentUserId: string,
    ): RenderResult<any> {
        return renderComponent(
            EventShowQueuedReservation,
            { reservation: mockReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                email: "current.user@example.com",
                                id: currentUserId,
                                name: "Current User",
                                role: canReserve ? Role.MANAGER : Role.STAFF,
                            },
                        },
                    },
                },
            },
        );
    }

    it("renders ReservationLabelChips and ReservationGeneralInfo components with correct props", async () => {
        const screen = renderComponentWithStore(true, "user123");

        await expect.element(screen.getByText("VIP")).toBeVisible();
        await expect.element(screen.getByText("John Doe", { exact: true })).toBeVisible();
        await expect.element(screen.getByText("18:00")).toBeVisible();
    });

    it('renders "Move to Floor Plan" button when canModify is true)', async () => {
        const screen = renderComponentWithStore(true, "user123");

        const moveButton = screen.getByRole("button", { name: /move to floor plan/i });
        await expect.element(moveButton).toBeVisible();
    });

    it('renders "Move to Floor Plan" button when canUnqueue is true (own reservation)', async () => {
        //  User is the owner but cannot reserve globally
        const screen = renderComponentWithStore(false, "creator456");

        const moveButton = screen.getByRole("button", { name: /move to floor plan/i });
        await expect.element(moveButton).toBeVisible();
    });

    it('does not render "Move to Floor Plan" button when canUnqueue is false', async () => {
        // User cannot reserve and is not the owner
        const screen = renderComponentWithStore(false, "user789");

        const moveButton = screen.getByRole("button", { name: /move to floor plan/i });
        await expect.element(moveButton).not.toBeInTheDocument();
    });

    it('emits "unqueue" event when "Move to Floor Plan" button is clicked (canModify)', async () => {
        // User can reserve
        const screen = renderComponentWithStore(true, "user123");
        await userEvent.click(screen.getByRole("button", { name: /move to floor plan/i }));

        expect(screen.emitted().unqueue).toBeTruthy();
        expect(screen.emitted().unqueue.length).toBe(1);
    });

    it('emits "unqueue" event when "Move to Floor Plan" button is clicked (own reservation)', async () => {
        //  User is the owner but cannot reserve globally
        const screen = renderComponentWithStore(false, "creator456");

        await userEvent.click(screen.getByRole("button", { name: /move to floor plan/i }));

        expect(screen.emitted().unqueue).toBeTruthy();
        expect(screen.emitted().unqueue.length).toBe(1);
    });

    it('updates "canUnqueue" when authStore changes (canModify becomes true)', async () => {
        //  User initially cannot reserve and is not the owner
        const screen = renderComponent(
            EventShowQueuedReservation,
            { reservation: mockReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                email: "user789@example.com",
                                id: "user789",
                                name: "User 789",
                                role: Role.STAFF,
                            },
                        },
                    },
                },
            },
        );

        // Initially, "Move to Floor Plan" button should not be present
        await expect
            .element(screen.getByRole("button", { name: /move to floor plan/i }))
            .not.toBeInTheDocument();

        // Rerender the component to reflect the store change
        const authStore = useAuthStore();
        authStore.user!.role = Role.MANAGER;
        screen.rerender({});

        // Now, the button should be present
        await expect
            .element(screen.getByRole("button", { name: /move to floor plan/i }))
            .toBeVisible();
    });

    it('updates "canUnqueue" when authStore changes (own reservation)', async () => {
        //  User initially cannot reserve and is not the owner
        const screen = renderComponent(
            EventShowQueuedReservation,
            { reservation: mockReservation, timezone: getDefaultTimezone() },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                email: "user789@example.com",
                                id: "user789",
                                name: "User 789",
                                role: Role.STAFF,
                            },
                        },
                    },
                },
            },
        );

        // Initially, "Move to Floor Plan" button should not be present
        await expect
            .element(screen.getByRole("button", { name: /move to floor plan/i }))
            .not.toBeInTheDocument();

        // Update authStore to make the user the owner
        const authStore = useAuthStore();
        authStore.user!.id = "creator456";
        screen.rerender({});

        // Now, the button should be present
        await expect
            .element(screen.getByRole("button", { name: /move to floor plan/i }))
            .toBeVisible();
    });

    it('renders "Delete" button when canModify is true (canModify)', async () => {
        const screen = renderComponentWithStore(true, "user123");

        const deleteButton = screen.getByRole("button", { name: /delete/i });
        await expect.element(deleteButton).toBeVisible();
    });

    it('renders "Delete" button when canModify is true (own reservation)', async () => {
        // User is the owner but cannot reserve globally
        const screen = renderComponentWithStore(false, "creator456");

        const deleteButton = screen.getByRole("button", { name: /delete/i });
        await expect.element(deleteButton).toBeVisible();
    });

    it('does not render "Delete" button when canModify is false', async () => {
        // User cannot reserve and is not the owner
        const screen = renderComponentWithStore(false, "user789");

        const deleteButton = screen.getByRole("button", { name: /delete/i });
        await expect.element(deleteButton).not.toBeInTheDocument();
    });

    it('emits "delete" event when "Delete" button is clicked (canReserve)', async () => {
        // User can reserve
        const screen = renderComponentWithStore(true, "user123");
        await userEvent.click(screen.getByRole("button", { name: /delete/i }));

        expect(screen.emitted().delete).toBeTruthy();
        expect(screen.emitted().delete.length).toBe(1);
    });

    it('emits "delete" event when "Delete" button is clicked (own reservation)', async () => {
        // User is the owner but cannot reserve globally
        const screen = renderComponentWithStore(false, "creator456");

        await userEvent.click(screen.getByRole("button", { name: /delete/i }));

        expect(screen.emitted().delete).toBeTruthy();
        expect(screen.emitted().delete.length).toBe(1);
    });
});
