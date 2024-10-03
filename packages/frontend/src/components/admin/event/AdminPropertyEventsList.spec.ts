import type { EventDoc } from "@firetable/types";
import AdminPropertyEventsList from "./AdminPropertyEventsList.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, vi } from "vitest";
import { userEvent, page } from "@vitest/browser/context";

vi.mock("src/components/admin/event/PageAdminEventsListItem.vue", () => ({
    default: {
        name: "PageAdminEventsListItem",
        props: ["event"],
        template: `
      <div class="event-item">
        {{ event.name }}
        <button class="edit-button" @click="$emit('left', { reset: () => {} })">Edit</button>
        <button class="delete-button" @click="$emit('right', { reset: () => {} })">Delete</button>
      </div>
    `,
    },
}));

const event1: EventDoc = {
    id: "event1",
    name: "Event 1",
    date: new Date("2021-05-15").getTime(),
} as EventDoc;

const event2: EventDoc = {
    id: "event2",
    name: "Event 2",
    date: new Date("2021-05-20").getTime(),
} as EventDoc;

const event3: EventDoc = {
    id: "event3",
    name: "Event 3",
    date: new Date("2021-06-10").getTime(),
} as EventDoc;

const event4: EventDoc = {
    id: "event4",
    name: "Event 4",
    date: new Date("2022-01-05").getTime(),
} as EventDoc;

const events = [event1, event2, event3, event4];

describe("PageAdminEventsList", () => {
    const propertyId = "prop1";

    it("displays a message when there are no events", () => {
        renderComponent(AdminPropertyEventsList, {
            propertyId,
            events: [],
            done: false,
        });
        const message = page.getByText("There are no events created for this property.");
        expect(message).toBeTruthy();
    });

    it("displays events grouped by year and month", () => {
        renderComponent(AdminPropertyEventsList, {
            propertyId,
            events,
            done: false,
        });

        // Check for year headings
        expect(page.getByText("2021")).toBeTruthy();
        expect(page.getByText("2022")).toBeTruthy();

        // Check for month headings
        expect(page.getByText("May")).toBeTruthy();
        expect(page.getByText("June")).toBeTruthy();
        expect(page.getByText("January")).toBeTruthy();

        // Check for event names
        expect(page.getByText("Event 1")).toBeTruthy();
        expect(page.getByText("Event 2")).toBeTruthy();
        expect(page.getByText("Event 3")).toBeTruthy();
        expect(page.getByText("Event 4")).toBeTruthy();
    });

    it('emits "load" event when "Load More" button is clicked', async () => {
        const screen = renderComponent(AdminPropertyEventsList, {
            propertyId,
            events,
            done: false,
        });

        const loadMoreButton = page.getByRole("button", { name: "Load More" });
        expect(loadMoreButton).toBeTruthy();

        const emitted = screen.emitted();
        await userEvent.click(loadMoreButton);
        // Check that the "load" event was emitted
        expect(emitted.load).toBeTruthy();
        expect(emitted.load[0]).toEqual([]);
    });

    it('emits "edit" and "delete" events when actions are triggered', async () => {
        const mockEvent = {
            id: "event1",
            name: "Event 1",
            date: new Date("2021-05-15").getTime(),
        };
        const screen = renderComponent(AdminPropertyEventsList, {
            propertyId,
            events: [mockEvent],
            done: false,
        });

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const editButton = screen.getByText("Edit");
        const deleteButton = screen.getByText("Delete");

        expect(editButton.query()).toBeTruthy();
        expect(deleteButton.query()).toBeTruthy();

        const emitted = screen.emitted();

        await userEvent.click(editButton);
        expect(emitted.edit).toBeTruthy();
        expect(emitted.edit[0]).toEqual([mockEvent]);

        await userEvent.click(deleteButton);
        expect(emitted.delete).toBeTruthy();
        expect(emitted.delete[0]).toEqual([mockEvent]);
    });
});
