import type { PlannedReservationDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { userEvent } from "@vitest/browser/context";
import { last } from "es-toolkit";
import { describe, expect, it } from "vitest";

import type { EventGuestSearchProps } from "./EventGuestSearch.vue";

import { renderComponent } from "../../../test-helpers/render-component";
import EventGuestSearch from "./EventGuestSearch.vue";

describe("EventGuestSearch.vue", () => {
    const floors = [
        { id: "floor1", name: "First Floor" },
        { id: "floor2", name: "Second Floor" },
    ];

    const reservations = [
        {
            // Guest has arrived
            arrived: true,
            floorId: "floor1",
            guestName: "John Doe",
            id: "john-doe-1",
            isVIP: false,
            tableLabel: "Table 1",
        },
        {
            // Guest has not arrived
            arrived: false,
            floorId: "floor2",
            guestName: "Jane Smith",
            id: "jane-smith-1",
            isVIP: true,
            tableLabel: "Table 2",
        },
    ];

    const showFloorNameInOption = true;

    function createComponent(
        customReservations?: Partial<PlannedReservationDoc>[],
    ): RenderResult<EventGuestSearchProps> {
        return renderComponent(EventGuestSearch, {
            allReservedTables: customReservations || reservations,
            floors,
            showFloorNameInOption,
        });
    }

    it("displays checkmark icon for guests who have arrived", async () => {
        const screen = createComponent();

        const input = screen.getByRole("textbox");
        await userEvent.click(input);
        await userEvent.fill(input, "John");

        const johnOption = screen.getByText("John Doe (Table 1) on First Floor");
        await expect.element(johnOption).toBeVisible();

        const checkIcon = screen.getByLabelText("Guest arrived checkmark icon");
        await expect.element(checkIcon).toBeVisible();
    });

    it("does not display checkmark icon for guests who have not arrived", async () => {
        const screen = createComponent();

        const input = screen.getByRole("textbox");
        await userEvent.fill(input, "Jane");
        await userEvent.click(input);

        // Find the option for Jane Smith
        const janeOption = screen.getByText("jane");
        await expect.element(janeOption).toBeVisible();
        // Check that the checkmark icon is not present
        const checkIcon = screen.getByText("check");
        await expect.element(checkIcon).not.toBeInTheDocument();
    });

    it("displays VIP chip for VIP guests", async () => {
        const screen = createComponent();

        const input = screen.getByRole("textbox");
        await userEvent.fill(input, "Jane");
        await userEvent.click(input);

        // Find the option for Jane Smith
        const janeOption = screen.getByText("jane");
        await expect.element(janeOption).toBeVisible();

        // Check if the VIP chip is present
        const vipChip = screen.getByText("VIP");
        await expect.element(vipChip).toBeVisible();
    });

    it("does not display VIP chip for non-VIP guests", async () => {
        const screen = createComponent();

        const input = screen.getByRole("textbox");
        await userEvent.fill(input, "John");
        await userEvent.click(input);

        const johnOption = screen.getByText("John Doe");
        await expect.element(johnOption).toBeVisible();

        // Check that the VIP chip is not present
        const vipChip = screen.getByText("VIP");
        await expect.element(vipChip).not.toBeInTheDocument();
    });

    it("does not display arrived guests when 'Hide arrived' is checked", async () => {
        const screen = createComponent();

        const input = screen.getByRole("textbox");
        await userEvent.click(input);

        // Find the 'Hide arrived' checkbox inside the dropdown
        const hideArrivedCheckbox = screen.getByRole("checkbox", { name: "Hide arrived" });
        await expect.element(hideArrivedCheckbox).toBeVisible();

        // Click the checkbox to hide arrived guests
        await userEvent.click(hideArrivedCheckbox);

        // Verify that John Doe is not in the options
        const johnOption = screen.getByText("John Doe (Table 1) on First Floor");
        await expect.element(johnOption).not.toBeInTheDocument();

        const janeOption = screen.getByText("Jane Smith (Table 2) on Second Floor");
        await expect.element(janeOption).toBeVisible();
    });

    it("keeps dropdown open and allows unchecking 'Hide arrived' when all guests are filtered out", async () => {
        // Create a scenario where only arrived guests match the search
        const onlyArrivedReservations = [
            {
                arrived: true,
                floorId: "floor1",
                guestName: "John Doe",
                id: "john-doe-arrived-only",
                isVIP: false,
                tableLabel: "Table 1",
            },
        ];

        const screen = renderComponent(EventGuestSearch, {
            allReservedTables: onlyArrivedReservations,
            floors,
            showFloorNameInOption,
        });

        const input = screen.getByRole("textbox");
        await userEvent.fill(input, "John");
        await userEvent.click(input);

        // Find and check the 'Hide arrived' checkbox
        const hideArrivedCheckbox = screen.getByRole("checkbox", { name: "Hide arrived" });
        await expect.element(hideArrivedCheckbox).toBeVisible();
        await userEvent.click(hideArrivedCheckbox);

        // Verify that the checkbox is still visible and can be unchecked
        await expect.element(hideArrivedCheckbox).toBeVisible();
        await expect.element(hideArrivedCheckbox).toBeChecked();

        // Uncheck the checkbox
        await userEvent.click(hideArrivedCheckbox);
        await expect.element(hideArrivedCheckbox).not.toBeChecked();

        // Verify that John Doe appears again
        const johnOption = screen.getByText("John Doe (Table 1) on First Floor");
        await expect.element(johnOption).toBeVisible();
    });

    it("emits only the selected guest when an item is clicked from multiple search results", async () => {
        const specificReservations = [
            {
                arrived: false,
                floorId: "floor1",
                guestName: "Milan Keser",
                id: "milan-keser-res",
                tableLabel: "Table A",
            },
            {
                arrived: false,
                floorId: "floor1",
                guestName: "Marko Keser",
                id: "marko-keser-res",
                tableLabel: "Table B",
            },
            {
                arrived: false,
                floorId: "floor2",
                guestName: "Peter Pan",
                id: "peter-pan-res",
                tableLabel: "Table C",
            },
        ];
        const screen = createComponent(specificReservations);

        const input = screen.getByRole("textbox");
        await userEvent.fill(input, "Keser");

        const milanOptionText = "Milan Keser (Table A) on First Floor";
        const markoOptionText = "Marko Keser (Table B) on First Floor";

        const milanOption = screen.getByText(milanOptionText);
        const markoOption = screen.getByText(markoOptionText);

        await expect.element(milanOption).toBeVisible();
        await expect.element(markoOption).toBeVisible();
        await userEvent.click(milanOption);

        const foundEvents = screen.emitted().found;
        expect(foundEvents).toBeTruthy();
        const lastFoundEvent = last(foundEvents) as any[];
        expect(lastFoundEvent[0]).toEqual([specificReservations[0]]);
    });
});
