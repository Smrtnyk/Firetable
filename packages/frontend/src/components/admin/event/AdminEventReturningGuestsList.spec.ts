import type { AdminEventReturningGuestsListProps } from "./AdminEventReturningGuestsList.vue";
import AdminEventReturningGuestsList from "./AdminEventReturningGuestsList.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";

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
            date: Date.now(),
            arrived: true,
            eventName: "Event 1",
            cancelled: false,
        };
        props.returningGuests = [
            {
                id: "guest1",
                name: "John Doe",
                contact: "john@example.com",
                visits: [sampleVisit],
                tableLabels: ["Table 1", "Table 2"],
            },
            {
                id: "guest2",
                name: "Jane Smith",
                contact: "jane@example.com",
                visits: [sampleVisit, sampleVisit],
                tableLabels: ["Table 3"],
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
                id: "guest1",
                name: "Guest With No Visits",
                contact: "guest@example.com",
                visits: [],
                tableLabels: [],
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
                id: "guest1",
                name: "Guest With Null Visits",
                contact: "nullguest@example.com",
                visits: [null, null],
                tableLabels: ["Table A"],
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
