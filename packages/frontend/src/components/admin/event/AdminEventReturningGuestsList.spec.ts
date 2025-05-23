import { beforeEach, describe, expect, it } from "vitest";

import type { AdminEventReturningGuestsListProps } from "./AdminEventReturningGuestsList.vue";

import { renderComponent } from "../../../../test-helpers/render-component";
import AdminEventReturningGuestsList from "./AdminEventReturningGuestsList.vue";

describe("ReturningGuestsList", () => {
    let props: AdminEventReturningGuestsListProps;

    beforeEach(() => {
        props = {
            organisationId: "org1",
            returningGuests: [],
        };
    });

    it("renders 'No returning guests' message when list is empty", async () => {
        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that the 'No returning guests' message is displayed
        await expect.element(screen.getByText("No returning guests")).toBeVisible();

        // Ensure that no guest items are rendered
        await expect.element(screen.getByRole("listitem").first()).not.toBeInTheDocument();
    });

    it("renders a list of returning guests", async () => {
        const sampleVisit = {
            arrived: true,
            cancelled: false,
            date: Date.now(),
            eventName: "Event 1",
        };
        props.returningGuests = [
            {
                contact: "john@example.com",
                id: "guest1",
                name: "John Doe",
                tableLabels: ["Table 1", "Table 2"],
                visits: [sampleVisit],
            },
            {
                contact: "jane@example.com",
                id: "guest2",
                name: "Jane Smith",
                tableLabels: ["Table 3"],
                visits: [sampleVisit, sampleVisit],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Ensure 'No returning guests' message is not displayed
        const noGuestsMessage = screen.getByText("No returning guests");
        await expect.element(noGuestsMessage).not.toBeInTheDocument();

        // Check that the correct number of guest items are rendered
        expect(screen.getByRole("listitem").all()).toHaveLength(2);

        // Check that guest details are displayed correctly
        const firstGuestVisits = screen.getByText("1 previous visits");
        await expect.element(firstGuestVisits).toBeVisible();

        const firstGuestNameAndTables = screen.getByText("John Doe on Table 1, Table 2");
        await expect.element(firstGuestNameAndTables).toBeVisible();

        const secondGuestVisits = screen.getByText("2 previous visits");
        await expect.element(secondGuestVisits).toBeVisible();

        const secondGuestNameAndTables = screen.getByText("Jane Smith on Table 3");
        await expect.element(secondGuestNameAndTables).toBeVisible();
    });

    it("handles guests with no visits gracefully", async () => {
        props.returningGuests = [
            {
                contact: "guest@example.com",
                id: "guest1",
                name: "Guest With No Visits",
                tableLabels: [],
                visits: [],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that '0 previous visits' is displayed
        const guestVisits = screen.getByText("0 previous visits");
        await expect.element(guestVisits).toBeVisible();

        // Check that the name is displayed correctly
        const guestName = screen.getByText("Guest With No Visits on ");
        await expect.element(guestName).toBeVisible();
    });

    it("handles guests with null visits", async () => {
        props.returningGuests = [
            {
                contact: "nullguest@example.com",
                id: "guest1",
                name: "Guest With Null Visits",
                tableLabels: ["Table A"],
                visits: [null, null],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that '2 previous visits' is displayed
        const guestVisits = screen.getByText("2 previous visits");
        await expect.element(guestVisits).toBeVisible();

        // Check that the name and tables are displayed correctly
        const guestNameAndTables = screen.getByText("Guest With Null Visits on Table A");
        await expect.element(guestNameAndTables).toBeVisible();
    });
});
