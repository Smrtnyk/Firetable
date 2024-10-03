import AdminEventReturningGuestsList from "./AdminEventReturningGuestsList.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";

describe("ReturningGuestsList", () => {
    let props;

    beforeEach(() => {
        props = {
            organisationId: "org1",
            returningGuests: [],
        };
    });

    it("renders 'No returning guests' message when list is empty", () => {
        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that the 'No returning guests' message is displayed
        const noGuestsMessage = screen.getByText("No returning guests").query();
        expect(noGuestsMessage).toBeTruthy();

        // Ensure that no guest items are rendered
        const guestItems = screen.getByRole("listitem").elements();
        expect(guestItems.length).toBe(0);
    });

    it("renders a list of returning guests", () => {
        props.returningGuests = [
            {
                name: "John Doe",
                contact: "john@example.com",
                visits: [{ date: Date.now() }],
                tableLabels: ["Table 1", "Table 2"],
            },
            {
                name: "Jane Smith",
                contact: "jane@example.com",
                visits: [{ date: Date.now() }, { date: Date.now() }],
                tableLabels: ["Table 3"],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Ensure 'No returning guests' message is not displayed
        const noGuestsMessage = screen.getByText("No returning guests").query();
        expect(noGuestsMessage).toBeNull();

        // Check that the correct number of guest items are rendered
        const guestItems = screen.getByRole("listitem").elements();
        expect(guestItems.length).toBe(2);

        // Check that guest details are displayed correctly
        const firstGuestVisits = screen.getByText("1 previous visits").query();
        expect(firstGuestVisits).toBeTruthy();

        const firstGuestNameAndTables = screen.getByText("John Doe on Table 1, Table 2").query();
        expect(firstGuestNameAndTables).toBeTruthy();

        const secondGuestVisits = screen.getByText("2 previous visits").query();
        expect(secondGuestVisits).toBeTruthy();

        const secondGuestNameAndTables = screen.getByText("Jane Smith on Table 3").query();
        expect(secondGuestNameAndTables).toBeTruthy();
    });

    it("handles guests with no visits gracefully", () => {
        props.returningGuests = [
            {
                name: "Guest With No Visits",
                contact: "guest@example.com",
                visits: [],
                tableLabels: [],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that '0 previous visits' is displayed
        const guestVisits = screen.getByText("0 previous visits").query();
        expect(guestVisits).toBeTruthy();

        // Check that the name is displayed correctly
        const guestName = screen.getByText("Guest With No Visits on ").query();
        expect(guestName).toBeTruthy();
    });

    it("handles guests with null visits", () => {
        props.returningGuests = [
            {
                name: "Guest With Null Visits",
                contact: "nullguest@example.com",
                visits: [null, null],
                tableLabels: ["Table A"],
            },
        ];

        const screen = renderComponent(AdminEventReturningGuestsList, props);

        // Check that '2 previous visits' is displayed
        const guestVisits = screen.getByText("2 previous visits").query();
        expect(guestVisits).toBeTruthy();

        // Check that the name and tables are displayed correctly
        const guestNameAndTables = screen.getByText("Guest With Null Visits on Table A").query();
        expect(guestNameAndTables).toBeTruthy();
    });
});
