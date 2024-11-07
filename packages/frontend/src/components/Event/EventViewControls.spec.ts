import type { RenderResult } from "vitest-browser-vue";
import type { EventViewControlsProps } from "./EventViewControls.vue";
import EventViewControls from "./EventViewControls.vue";
import { renderComponent } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { userEvent, page } from "@vitest/browser/context";
import { last } from "es-toolkit";

describe("EventViewControls.vue", () => {
    const floors: EventViewControlsProps["floors"] = [
        { id: "floor1", name: "First Floor" },
        { id: "floor2", name: "Second Floor" },
    ];

    let activeFloor: EventViewControlsProps["activeFloor"];

    function isActiveFloor(floorId: string): boolean {
        return floorId === activeFloor!.id;
    }

    function render(
        props: Partial<EventViewControlsProps> = {},
    ): RenderResult<EventViewControlsProps> {
        return renderComponent(EventViewControls, {
            activeFloor: floors[0],
            floors,
            isActiveFloor,
            hasMultipleFloorPlans: true,
            canSeeAdminEvent: true,
            queuedReservationsCount: 0,
            guestListCount: 0,
            canExportReservations: false,
            ...props,
        });
    }

    async function showMenu(): Promise<void> {
        const btnDropdown = page.getByLabelText("Toggle event controls menu");
        await userEvent.click(btnDropdown);
    }

    beforeEach(() => {
        activeFloor = floors[0];
    });

    it("renders prev and next floor btns", async () => {
        const screen = render();
        await showMenu();

        const prevFloorBtn = screen.getByLabelText("Show previous floor");
        const nextFloorBtn = screen.getByLabelText("Show next floor");

        await expect.element(prevFloorBtn).toBeVisible();
        await expect.element(nextFloorBtn).toBeVisible();
    });

    it("sets prev floor btn as disabled when multi floors", async () => {
        const screen = render();
        await showMenu();

        const prevFloorBtn = screen.getByLabelText("Show previous floor");
        await expect.element(prevFloorBtn).toBeDisabled();

        const nextFloorBtn = screen.getByLabelText("Show next floor");
        await expect.element(nextFloorBtn).not.toBeDisabled();
    });

    it("sets next floor btn as disabled when multi floors", async () => {
        activeFloor = floors[1];
        const screen = render();
        await showMenu();

        const prevFloorBtn = screen.getByLabelText("Show previous floor");
        await expect.element(prevFloorBtn).not.toBeDisabled();

        const nextFloorBtn = screen.getByLabelText("Show next floor");
        await expect.element(nextFloorBtn).toBeDisabled();
    });

    it("does not render switch floor plans when floors are of length 1", async () => {
        const screen = render({
            floors: [floors[0]],
        });
        await showMenu();

        const prevFloorBtn = screen.getByLabelText("Show previous floor");
        const nextFloorBtn = screen.getByLabelText("Show next floor");

        await expect.element(prevFloorBtn).not.toBeInTheDocument();
        await expect.element(nextFloorBtn).not.toBeInTheDocument();
    });

    it("renders 'Show Details' btn when 'canSeeAdminEvent' is true", async () => {
        const screen = render({ canSeeAdminEvent: true });
        await showMenu();

        const navigateToAdminBtn = screen.getByLabelText("Navigate to admin event");
        await expect.element(navigateToAdminBtn).toBeVisible();
    });

    it("does not render 'Show Details' option when 'canSeeAdminEvent' is false", async () => {
        const screen = render({ canSeeAdminEvent: false });
        await showMenu();

        await expect.element(screen.getByText("Show Details")).not.toBeInTheDocument();
    });

    it("emits 'set-active-floor' with correct floor data when next floor is selected", async () => {
        const screen = render();
        await showMenu();

        const nextFloorBtn = screen.getByLabelText("Show next floor");
        await userEvent.click(nextFloorBtn);

        const emitted = last(
            screen.emitted<EventViewControlsProps["activeFloor"][]>()["set-active-floor"],
        );
        expect(emitted![0]).toStrictEqual(floors[1]);
    });

    it("emits 'toggle-queued-reservations-drawer-visibility' when 'Table Waiting list' is clicked", async () => {
        const screen = render({
            canSeeAdminEvent: false,
        });
        await showMenu();

        const waitingListItem = screen.getByLabelText(
            "Toggle queued reservations drawer visibility",
        );
        await userEvent.click(waitingListItem);

        expect(screen.emitted()["toggle-queued-reservations-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'toggle-event-guest-list-drawer-visibility' when 'Guestlist' is clicked", async () => {
        const screen = render();
        await showMenu();

        const guestListItem = screen.getByLabelText("Toggle event guest list drawer visibility");
        await userEvent.click(guestListItem);

        expect(screen.emitted()["toggle-event-guest-list-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'show-event-info' when 'Event Info' is clicked", async () => {
        const screen = render({
            canSeeAdminEvent: false,
        });
        await showMenu();

        const eventInfoItem = screen.getByLabelText("Show event info");
        await userEvent.click(eventInfoItem);

        expect(screen.emitted()["show-event-info"]).toHaveLength(1);
    });

    it("emits 'navigate-to-admin-event' when 'Show Details' is clicked", async () => {
        const screen = render({
            canSeeAdminEvent: true,
        });
        await showMenu();

        const navigateToAdminBtn = screen.getByLabelText("Navigate to admin event");
        await userEvent.click(navigateToAdminBtn);

        expect(screen.emitted()["navigate-to-admin-event"]).toHaveLength(1);
    });

    it("emits export-reservations event when export button is clicked", async () => {
        const screen = render({
            queuedReservationsCount: 0,
            guestListCount: 0,
            canExportReservations: true,
        });

        const exportButton = screen.getByLabelText("Export reservations");

        await userEvent.click(exportButton);
        expect(screen.emitted("export-reservations")).toBeTruthy();
        expect(screen.emitted("export-reservations")?.length).toBe(1);
    });

    it("doesn't render export button when canExportReservations is false", async () => {
        const screen = render({
            canExportReservations: false,
        });

        const exportButton = screen.getByLabelText("Export reservations");
        await expect.element(exportButton).not.toBeInTheDocument();
    });

    describe("Badges", () => {
        it("displays correct count in queued reservations badge", async () => {
            const screen = render({
                queuedReservationsCount: 5,
            });

            const badge = screen
                .getByLabelText("Toggle queued reservations drawer visibility")
                .getByRole("status");

            await expect.element(badge!).toBeVisible();
            await expect.element(badge!).toHaveTextContent("5");
        });

        it("displays correct count in guest list badge", async () => {
            const screen = render({
                guestListCount: 10,
            });

            const badge = screen
                .getByLabelText("Toggle event guest list drawer visibility")
                .getByRole("status");

            await expect.element(badge!).toBeVisible();
            await expect.element(badge!).toHaveTextContent("10");
        });

        it("shows badges only when counts are greater than 0", async () => {
            const screen = render({
                queuedReservationsCount: 0,
                guestListCount: 0,
            });

            const queuedBadge = screen
                .getByLabelText("Toggle queued reservations drawer visibility")
                .getByRole("status");
            const guestListBadge = screen
                .getByLabelText("Toggle event guest list drawer visibility")
                .getByRole("status");

            await expect.element(queuedBadge).not.toBeInTheDocument();
            await expect.element(guestListBadge).not.toBeInTheDocument();
        });
    });
});
