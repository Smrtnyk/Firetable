import type { RenderResult } from "vitest-browser-vue";
import type { EventViewControlsProps } from "./EventViewControls.vue";
import EventViewControls from "./EventViewControls.vue";
import { renderComponent } from "../../../test-helpers/render-component";
import { describe, it, expect } from "vitest";
import { userEvent, page } from "@vitest/browser/context";
import { last } from "es-toolkit";

describe("EventViewControls.vue", () => {
    const floorInstances: EventViewControlsProps["floorInstances"] = [
        { id: "floor1", name: "First Floor" },
        { id: "floor2", name: "Second Floor" },
    ];

    const activeFloor = { id: "floor1", name: "First Floor" };

    function render(
        props: Partial<EventViewControlsProps> = {},
    ): RenderResult<EventViewControlsProps> {
        return renderComponent(EventViewControls, {
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: true,
            ...props,
        });
    }

    async function showMenu(): Promise<void> {
        const btnDropdown = page.getByLabelText("Toggle event controls menu");
        await userEvent.click(btnDropdown);
    }

    it("renders the active floor name", async () => {
        const screen = render();
        await showMenu();

        await expect.element(screen.getByText("First Floor")).toBeVisible();
        await expect.element(screen.getByText("Current floor")).toBeVisible();
    });

    it("renders floor plans dropdown when hasMultipleFloorPlans is true", async () => {
        const screen = render();
        await showMenu();

        await expect.element(screen.getByText("First Floor")).toBeVisible();
    });

    it("does not render floor plans dropdown when hasMultipleFloorPlans is false", async () => {
        const screen = render({ hasMultipleFloorPlans: false });
        await showMenu();

        expect(screen.getByText("First Floor").query()).toBeNull();
    });

    it("renders 'Show Details' option when isAdmin is true", async () => {
        const screen = render({ isAdmin: true });
        await showMenu();

        await expect.element(screen.getByText("Show Details")).toBeVisible();
    });

    it("does not render 'Show Details' option when isAdmin is false", async () => {
        const screen = render({ isAdmin: false });
        await showMenu();

        expect(screen.getByText("Show Details").query()).toBeNull();
    });

    it("emits 'set-active-floor' with correct floor data when a floor is selected", async () => {
        const screen = render({
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: false,
        });
        await showMenu();

        // Open the floor plans dropdown
        const floorItem = screen.getByText("First Floor");
        await userEvent.click(floorItem);

        // Select the second floor
        const secondFloorOption = screen.getByText("Second Floor");
        await userEvent.click(secondFloorOption);

        const emitted = last(
            screen.emitted()["set-active-floor"],
        ) as EventViewControlsProps["activeFloor"][];
        expect(emitted[0]).toStrictEqual(floorInstances[1]);
    });

    it("emits 'toggle-queued-reservations-drawer-visibility' when 'Table Waiting list' is clicked", async () => {
        const screen = render({
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: false,
        });
        await showMenu();

        const waitingListItem = screen.getByText("On-hold reservations");
        await userEvent.click(waitingListItem);

        expect(screen.emitted()["toggle-queued-reservations-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'toggle-event-guest-list-drawer-visibility' when 'Guestlist' is clicked", async () => {
        const screen = render({
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: false,
        });
        await showMenu();

        const guestListItem = screen.getByText("Guestlist");
        await userEvent.click(guestListItem);

        expect(screen.emitted()["toggle-event-guest-list-drawer-visibility"]).toHaveLength(1);
    });

    it("emits 'show-event-info' when 'Event Info' is clicked", async () => {
        const screen = render({
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: false,
        });
        await showMenu();

        const eventInfoItem = screen.getByText("Event Info");
        await userEvent.click(eventInfoItem);

        expect(screen.emitted()["show-event-info"]).toHaveLength(1);
    });

    it("emits 'navigate-to-admin-event' when 'Show Details' is clicked", async () => {
        const screen = render({
            activeFloor,
            floorInstances,
            hasMultipleFloorPlans: true,
            isAdmin: true,
        });
        await showMenu();

        const showDetailsItem = screen.getByText("Show Details");
        await userEvent.click(showDetailsItem);

        expect(screen.emitted()["navigate-to-admin-event"]).toHaveLength(1);
    });
});
