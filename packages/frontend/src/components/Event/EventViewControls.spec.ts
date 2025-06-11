import type { RenderResult } from "vitest-browser-vue";

import { page, userEvent } from "@vitest/browser/context";
import { last } from "es-toolkit";
import { beforeEach, describe, expect, it } from "vitest";

import type { EventViewControlsProps } from "./EventViewControls.vue";

import { renderComponent } from "../../../test-helpers/render-component";
import EventViewControls from "./EventViewControls.vue";

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
            canExportReservations: false,
            canSeeAdminEvent: true,
            floors,
            guestListCount: 0,
            isActiveFloor,
            queuedReservationsCount: 0,
            ...props,
        });
    }

    async function showMenu(): Promise<void> {
        const btnDropdown = page.getByLabelText("Event controls menu");
        await userEvent.click(btnDropdown);
    }

    beforeEach(() => {
        activeFloor = floors[0];
    });

    it("renders floor selection in menu when multiple floors exist", async () => {
        render();
        await showMenu();

        // Check for radiogroup
        const radioGroup = page.getByRole("radiogroup", { name: "Select floor" });
        await expect.element(radioGroup).toBeVisible();

        // Check for radio buttons
        const firstFloorRadio = page.getByRole("radio", { name: /first floor.*current floor/i });
        const secondFloorRadio = page.getByRole("radio", { name: "Second Floor" });

        await expect.element(firstFloorRadio).toBeVisible();
        await expect.element(secondFloorRadio).toBeVisible();
    });

    it("shows active floor with check icon", async () => {
        render();
        await showMenu();

        // Check that the active floor has aria-checked="true"
        const activeFloorRadio = page.getByRole("radio", { name: /first floor.*current floor/i });
        await expect.element(activeFloorRadio).toBeVisible();
        await expect.element(activeFloorRadio).toHaveAttribute("aria-checked", "true");

        // Check that inactive floor has aria-checked="false"
        const inactiveFloorRadio = page.getByRole("radio", { name: "Second Floor" });
        await expect.element(inactiveFloorRadio).toHaveAttribute("aria-checked", "false");
    });

    it("shows inactive floors with regular circle icon", async () => {
        render();
        await showMenu();

        const inactiveFloorRadio = page.getByRole("radio", { name: "Second Floor" });
        await expect.element(inactiveFloorRadio).toBeVisible();
        await expect.element(inactiveFloorRadio).toHaveAttribute("aria-checked", "false");
    });

    it("does not render floors section when only one floor exists", async () => {
        render({
            floors: [floors[0]],
        });
        await showMenu();

        const floorsHeader = page.getByText("Floors");
        await expect.element(floorsHeader).not.toBeInTheDocument();
    });

    it("renders 'Admin View' option when 'canSeeAdminEvent' is true", async () => {
        render({ canSeeAdminEvent: true });
        await showMenu();

        const adminViewItem = page.getByLabelText("Navigate to admin view");
        await expect.element(adminViewItem).toBeVisible();
    });

    it("does not render 'Admin View' option when 'canSeeAdminEvent' is false", async () => {
        render({ canSeeAdminEvent: false });
        await showMenu();

        const adminViewItem = page.getByLabelText("Navigate to admin view");
        await expect.element(adminViewItem).not.toBeInTheDocument();
    });

    it("emits 'set-active-floor' with correct floor data when floor is selected", async () => {
        const screen = render();
        await showMenu();

        const secondFloorRadio = page.getByRole("radio", { name: "Second Floor" });
        await userEvent.click(secondFloorRadio);

        const emitted = last(
            screen.emitted<EventViewControlsProps["activeFloor"][]>()["set-active-floor"],
        );
        expect(emitted![0]).toStrictEqual(floors[1]);
    });

    it("emits 'toggle-queued-reservations-drawer-visibility' when 'Queued Reservations' is clicked", async () => {
        const screen = render();
        await showMenu();

        const queuedReservationsItem = page.getByLabelText("Toggle queued reservations drawer");
        await userEvent.click(queuedReservationsItem);

        expect(screen.emitted()["toggle-queued-reservations-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'toggle-event-guest-list-drawer-visibility' when 'Guest List' is clicked", async () => {
        const screen = render();
        await showMenu();

        const guestListItem = page.getByLabelText("Toggle guest list drawer");
        await userEvent.click(guestListItem);

        expect(screen.emitted()["toggle-event-guest-list-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'show-event-info' when 'Event Info' is clicked", async () => {
        const screen = render();
        await showMenu();

        const eventInfoItem = page.getByLabelText("Show event info");
        await userEvent.click(eventInfoItem);

        expect(screen.emitted()["show-event-info"]).toHaveLength(1);
    });

    it("emits 'navigate-to-admin-event' when 'Admin View' is clicked", async () => {
        const screen = render({
            canSeeAdminEvent: true,
        });
        await showMenu();

        const adminViewItem = page.getByLabelText("Navigate to admin view");
        await userEvent.click(adminViewItem);

        expect(screen.emitted()["navigate-to-admin-event"]).toHaveLength(1);
    });

    it("emits export-reservations event when 'Export Reservations' is clicked", async () => {
        const screen = render({
            canExportReservations: true,
        });
        await showMenu();

        const exportItem = page.getByLabelText("Export reservations");
        await userEvent.click(exportItem);

        expect(screen.emitted("export-reservations")).toBeTruthy();
        expect(screen.emitted("export-reservations")?.length).toBe(1);
    });

    it("doesn't render 'Export Reservations' when canExportReservations is false", async () => {
        render({
            canExportReservations: false,
        });
        await showMenu();

        const exportItem = page.getByLabelText("Export reservations");
        await expect.element(exportItem).not.toBeInTheDocument();
    });

    describe("Badges", () => {
        it("displays correct count in queued reservations badge in menu", async () => {
            render({
                queuedReservationsCount: 5,
            });
            await showMenu();

            const badge = page.getByLabelText("5 queued reservations");
            await expect.element(badge).toBeVisible();
            await expect.element(badge).toHaveTextContent("5");
        });

        it("displays correct count in guest list badge in menu", async () => {
            render({
                guestListCount: 10,
            });
            await showMenu();

            const badge = page.getByLabelText("10 guests");
            await expect.element(badge).toBeVisible();
            await expect.element(badge).toHaveTextContent("10");
        });

        it("shows floating badge on menu button when notifications exist", async () => {
            render({
                guestListCount: 7,
                queuedReservationsCount: 3,
            });

            const floatingBadge = page.getByLabelText("10 notifications");
            await expect.element(floatingBadge).toBeVisible();
            await expect.element(floatingBadge).toHaveTextContent("10");
        });

        it("shows only menu item badges when counts are greater than 0", async () => {
            render({
                guestListCount: 0,
                queuedReservationsCount: 0,
            });
            await showMenu();

            const queuedBadge = page.getByLabelText("0 queued reservations");
            const guestListBadge = page.getByLabelText("0 guests");

            await expect.element(queuedBadge).not.toBeInTheDocument();
            await expect.element(guestListBadge).not.toBeInTheDocument();
        });

        it("does not show floating badge when no notifications exist", async () => {
            render({
                guestListCount: 0,
                queuedReservationsCount: 0,
            });

            const floatingBadge = page.getByLabelText("0 notifications");
            await expect.element(floatingBadge).not.toBeInTheDocument();
        });
    });
});
