import type { FTAutocompleteProps } from "./FTAutocomplete.vue";
import type { RenderResult } from "vitest-browser-vue";
import FTAutocomplete from "./FTAutocomplete.vue";
import { renderComponent } from "../../../test-helpers/render-component";
import { describe, it, expect } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("FTAutocomplete.vue", () => {
    const floors = [
        { id: "floor1", name: "First Floor" },
        { id: "floor2", name: "Second Floor" },
    ];

    const reservations = [
        {
            guestName: "John Doe",
            tableLabel: "Table 1",
            floorId: "floor1",
            isVIP: false,
            // Guest has arrived
            arrived: true,
        },
        {
            guestName: "Jane Smith",
            tableLabel: "Table 2",
            floorId: "floor2",
            isVIP: true,
            // Guest has not arrived
            arrived: false,
        },
    ];

    const showFloorNameInOption = true;

    function createComponent(): RenderResult<FTAutocompleteProps> {
        return renderComponent(FTAutocomplete, {
            floors,
            allReservedTables: reservations,
            showFloorNameInOption,
        });
    }

    it("displays checkmark icon for guests who have arrived", async () => {
        const screen = createComponent();

        const input = screen.getByRole("combobox");
        await userEvent.fill(input, "John");
        await userEvent.click(input);

        const johnOption = screen.getByText("John Doe (Table 1) on First Floor");
        await expect.element(johnOption).toBeVisible();

        const checkIcon = screen.getByLabelText("Guest arrived checkmark icon");
        await expect.element(checkIcon).toBeVisible();
    });

    it("does not display checkmark icon for guests who have not arrived", async () => {
        const screen = createComponent();

        const input = screen.getByRole("combobox");
        await userEvent.fill(input, "Jane");
        await userEvent.click(input);

        // Find the option for Jane Smith
        const janeOption = screen.getByText("jane");
        await expect.element(janeOption).toBeVisible();
        // Check that the checkmark icon is not present
        const checkIcon = screen.getByText("check");
        expect(checkIcon.query()).toBeNull();
    });

    it("displays VIP chip for VIP guests", async () => {
        const screen = createComponent();

        const input = screen.getByRole("combobox");
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

        const input = screen.getByRole("combobox");
        await userEvent.fill(input, "John");
        await userEvent.click(input);

        const johnOption = screen.getByText("John Doe");
        await expect.element(johnOption).toBeVisible();

        // Check that the VIP chip is not present
        const vipChip = screen.getByText("VIP");
        expect(vipChip.query()).toBeNull();
    });

    it("does not display arrived guests when 'Hide arrived' is checked", async () => {
        const screen = createComponent();

        const input = screen.getByRole("combobox");
        await userEvent.fill(input, "John");
        await userEvent.click(input);

        // Find the 'Hide arrived' checkbox inside the dropdown
        const hideArrivedCheckbox = screen.getByRole("checkbox", { name: "Hide arrived" });
        await expect.element(hideArrivedCheckbox).toBeVisible();

        // Click the checkbox to hide arrived guests
        await userEvent.click(hideArrivedCheckbox);

        // Verify that John Doe is not in the options
        const johnOption = screen.getByText("John Doe (Table 1) on First Floor");
        expect(johnOption.query()).toBeNull();

        const janeOption = screen.getByText("Jane Smith (Table 2) on Second Floor");
        await expect.element(janeOption).toBeVisible();
    });
});
