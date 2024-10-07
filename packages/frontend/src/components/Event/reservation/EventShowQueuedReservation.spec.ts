import type { QueuedReservationDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import EventShowQueuedReservation from "./EventShowQueuedReservation.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { useAuthStore } from "../../../stores/auth-store";
import { Role } from "@firetable/types";
import { describe, it, expect } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("EventShowQueuedReservation", () => {
    const mockReservation: QueuedReservationDoc = {
        id: "reservation1",
        guestName: "John Doe",
        consumption: 50,
        isVIP: true,
        numberOfGuests: 4,
        time: "18:00",
        reservedBy: {
            email: "john.doe@example.com",
            name: "John Doe",
            id: "user123",
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
            { reservation: mockReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: currentUserId,
                                email: "current.user@example.com",
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

    it('renders "Move to Floor Plan" button when canUnqueue is true (canReserve)', async () => {
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

    it('does not render "Move to Floor Plan" button when canUnqueue is false', () => {
        // User cannot reserve and is not the owner
        const screen = renderComponentWithStore(false, "user789");

        const moveButton = screen.getByRole("button", { name: /move to floor plan/i });
        expect(moveButton.query()).toBeNull();
    });

    it('emits "unqueue" event when "Move to Floor Plan" button is clicked (canReserve)', async () => {
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

    it('updates "canUnqueue" when authStore changes (canReserve becomes true)', async () => {
        //  User initially cannot reserve and is not the owner
        const screen = renderComponent(
            EventShowQueuedReservation,
            { reservation: mockReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user789",
                                email: "user789@example.com",
                                name: "User 789",
                                role: Role.STAFF,
                            },
                        },
                    },
                },
            },
        );

        // Initially, "Move to Floor Plan" button should not be present
        expect(screen.getByRole("button", { name: /move to floor plan/i }).query()).toBeNull();

        // Rerender the component to reflect the store change
        const authStore = useAuthStore();
        authStore.user.role = Role.MANAGER;
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
            { reservation: mockReservation },
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                id: "user789",
                                email: "user789@example.com",
                                name: "User 789",
                                role: Role.STAFF,
                            },
                        },
                    },
                },
            },
        );

        // Initially, "Move to Floor Plan" button should not be present
        expect(screen.getByRole("button", { name: /move to floor plan/i }).query()).toBeNull();

        // Update authStore to make the user the owner
        const authStore = useAuthStore();
        authStore.user.id = "creator456";
        screen.rerender({});

        // Now, the button should be present
        await expect
            .element(screen.getByRole("button", { name: /move to floor plan/i }))
            .toBeVisible();
    });
});
