import type { EventDoc } from "@firetable/types";

import { page, userEvent } from "@vitest/browser/context";
import { getDefaultTimezone } from "src/helpers/date-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderComponent, t } from "../../../../test-helpers/render-component";
import AdminPropertyEventsList from "./AdminPropertyEventsList.vue";

vi.mock("src/components/admin/event/PageAdminEventsListItem.vue", () => ({
    default: {
        name: "PageAdminEventsListItem",
        props: ["event"],
        template: `
            <div class="event-item">
                <div class="event-name">{{ event.name }}</div>
                <button class="edit-button" @click="$emit('left', { reset: () => {} })">Edit</button>
                <button class="delete-button" @click="$emit('right', { reset: () => {} })">Delete</button>
            </div>
        `,
    },
}));

const eventPast1: EventDoc = {
    date: new Date("2021-05-15").getTime(),
    id: "eventPast1",
    name: "Past Event 1",
} as EventDoc;

const eventUpcoming1: EventDoc = {
    date: new Date("2022-07-20").getTime(),
    id: "eventUpcoming1",
    name: "Upcoming Event 1",
} as EventDoc;

const eventUpcoming2: EventDoc = {
    date: new Date("2022-08-10").getTime(),
    id: "eventUpcoming2",
    name: "Upcoming Event 2",
} as EventDoc;

const eventPast2: EventDoc = {
    date: new Date("2021-05-05").getTime(),
    id: "eventPast2",
    name: "Past Event 2",
} as EventDoc;

const events = [eventPast1, eventUpcoming1, eventUpcoming2, eventPast2];

describe("PageAdminEventsList", () => {
    const propertyId = "prop1";

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2022-06-01T00:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("displays a message when there are no events", async () => {
        renderComponent(AdminPropertyEventsList, {
            done: false,
            events: [],
            propertyId,
            timezone: getDefaultTimezone(),
        });

        await expect.element(page.getByText(t("PageAdminEvents.noEventsMessage"))).toBeVisible();
    });

    it("displays events grouped by upcoming and past events with a marker", async () => {
        renderComponent(AdminPropertyEventsList, {
            done: false,
            events,
            propertyId,
            timezone: getDefaultTimezone(),
        });

        // Check that upcoming events are displayed
        await expect.element(page.getByText("Upcoming Event 1")).toBeVisible();
        await expect.element(page.getByText("Upcoming Event 2")).toBeVisible();

        // Check that "Past Events" label is displayed
        await expect.element(page.getByText(t("PageAdminEvents.pastEventsLabel"))).toBeVisible();

        // Check that past events are displayed
        await expect.element(page.getByText("Past Event 1")).toBeVisible();
        await expect.element(page.getByText("Past Event 2")).toBeVisible();

        // Optionally, check that the upcoming events are listed before the past events
        const eventItems = document.querySelectorAll(".event-name");
        const eventNames = Array.from(eventItems).map((item) => item.textContent?.trim());

        expect(eventNames).toEqual([
            // Upcoming events first
            "Upcoming Event 1",
            "Upcoming Event 2",
            // Past Events marker (not an event-item, so not in this list)
            // Past events after the marker
            "Past Event 1",
            "Past Event 2",
        ]);
    });

    it("displays events grouped by year and month", async () => {
        renderComponent(AdminPropertyEventsList, {
            done: false,
            events,
            propertyId,
            timezone: getDefaultTimezone(),
        });

        // Check for year headings
        await expect.element(page.getByText("2021")).toBeVisible();
        await expect.element(page.getByText("2022")).toBeVisible();

        // Check for month headings
        await expect.element(page.getByText("May")).toBeVisible();
        await expect.element(page.getByText("July")).toBeVisible();
        await expect.element(page.getByText("August")).toBeVisible();

        // Check for event names
        await expect.element(page.getByText("Upcoming Event 1")).toBeVisible();
        await expect.element(page.getByText("Upcoming Event 2")).toBeVisible();
        await expect.element(page.getByText("Past Event 1")).toBeVisible();
        await expect.element(page.getByText("Past Event 2")).toBeVisible();
    });

    it('emits "load" event when "Load More" button is clicked', async () => {
        const screen = renderComponent(AdminPropertyEventsList, {
            done: false,
            events,
            propertyId,
            timezone: getDefaultTimezone(),
        });

        await userEvent.click(page.getByRole("button", { name: "Load More" }));
        // Check that the "load" event was emitted
        const emitted = screen.emitted();
        expect(emitted.load).toBeTruthy();
        expect(emitted.load[0]).toEqual([]);
    });

    it('emits "edit" and "delete" events when actions are triggered', async () => {
        const mockEvent = {
            date: new Date("2021-05-15").getTime(),
            id: "event1",
            name: "Event 1",
        };
        const screen = renderComponent(AdminPropertyEventsList, {
            done: false,
            events: [mockEvent],
            propertyId,
            timezone: getDefaultTimezone(),
        });

        await userEvent.click(screen.getByText("Edit"));

        const emitted = screen.emitted();
        expect(emitted.edit).toBeTruthy();
        expect(emitted.edit[0]).toEqual([mockEvent]);

        await userEvent.click(screen.getByText("Delete"));
        expect(emitted.delete).toBeTruthy();
        expect(emitted.delete[0]).toEqual([mockEvent]);
    });
});
