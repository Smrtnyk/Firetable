import type { InventoryItemDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import InventoryTable from "./InventoryTable.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { InventoryItemType } from "@firetable/types";
import { userEvent, page } from "@vitest/browser/context";

const sampleItems: InventoryItemDoc[] = [
    {
        id: "1",
        name: "Red Bull 250ml",
        type: InventoryItemType.DRINK,
        category: "Energy drinks",
        price: 2.99,
        quantity: 50,
    },
    {
        id: "2",
        name: "Chocolate Bar",
        type: InventoryItemType.FOOD,
        category: "Snacks",
        price: 1.49,
        quantity: 100,
    },
];

describe("InventoryTable.vue", () => {
    let screen: RenderResult<{ rows: InventoryItemDoc[] }>;

    beforeEach(() => {
        screen = renderComponent(InventoryTable, { rows: sampleItems });
    });

    it("displays all sample items in the table", () => {
        const trs = document.querySelectorAll("tbody tr");
        expect(trs.length).toBe(2);
    });

    it("displays the correct data for each item", () => {
        for (const item of sampleItems) {
            const nameCell = page.getByText(item.name);
            expect(nameCell.elements().length).toBeGreaterThan(0);

            const typeLabel = getTypeLabel(item.type);
            const typeCell = page.getByText(typeLabel);
            expect(typeCell.elements().length).toBeGreaterThan(0);

            const categoryCell = page.getByText(item.category);
            expect(categoryCell.elements().length).toBeGreaterThan(0);

            const priceText = `$${item.price.toFixed(2)}`;
            const priceCell = page.getByText(priceText);
            expect(priceCell.elements().length).toBeGreaterThan(0);

            const quantityCell = page.getByText(item.quantity.toString());
            expect(quantityCell.elements().length).toBeGreaterThan(0);
        }
    });

    it("filters items based on search input", async () => {
        const searchInput = page.getByPlaceholder("Search");
        await userEvent.type(searchInput, "Red Bull");

        // Only the 'Red Bull 250ml' item should be visible
        const redBullRow = page.getByText("Red Bull 250ml");
        expect(redBullRow.elements().length).toBe(1);

        const chocolateBarRow = page.getByText("Chocolate Bar");
        expect(chocolateBarRow.elements().length).toBe(0);
    });

    it(`emits "edit-item" event when edit button is clicked`, async () => {
        const editButton = page.getByAltText("Edit Red Bull 250ml");
        expect(editButton.elements().length).toBe(1);

        await userEvent.click(editButton);

        const emittedEvents = screen.emitted("edit-item");
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[0]);
    });

    it(`emits "delete-item" event when delete button is clicked`, async () => {
        const deleteButton = page.getByAltText("Delete Chocolate Bar");
        expect(deleteButton.elements().length).toBe(1);

        await userEvent.click(deleteButton);

        const emittedEvents = screen.emitted("delete-item");
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[1]);
    });
});

function getTypeLabel(type: InventoryItemType): string {
    switch (type) {
        case InventoryItemType.DRINK:
            return "Drink";
        case InventoryItemType.FOOD:
            return "Food";
        case InventoryItemType.OTHER:
            return "Other";
        default:
            return type;
    }
}
