import type { InventoryItemDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import InventoryTable from "./InventoryTable.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import {
    DrinkMainCategory,
    InventoryItemType,
    SpiritSubCategory,
    NonAlcoholicCategory,
} from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "@vitest/browser/context";

const sampleItems: InventoryItemDoc[] = [
    {
        id: "1",
        name: "Red Bull 250ml",
        type: InventoryItemType.DRINK,
        mainCategory: DrinkMainCategory.NON_ALCOHOLIC,
        subCategory: NonAlcoholicCategory.ENERGY_DRINK,
        quantity: 50,
        supplier: "Red Bull GmbH",
        volume: 250,
        isActive: true,
    },
    {
        id: "2",
        name: "Absolut Vodka",
        type: InventoryItemType.DRINK,
        mainCategory: DrinkMainCategory.SPIRITS,
        subCategory: SpiritSubCategory.VODKA,
        quantity: 100,
        supplier: "Pernod Ricard",
        volume: 700,
        alcoholContent: 40,
        isActive: true,
    },
];

describe("InventoryTable.vue", () => {
    let screen: RenderResult<{ rows: InventoryItemDoc[] }>;

    beforeEach(() => {
        screen = renderComponent(InventoryTable, { rows: sampleItems, title: "Title" });
    });

    it("displays title", async () => {
        await expect.element(screen.getByText("Title")).toBeVisible();
    });

    it("displays all sample items in the table", () => {
        const trs = document.querySelectorAll("tbody tr");
        expect(trs.length).toBe(2);
    });

    it("displays the correct data for each item", () => {
        for (const item of sampleItems) {
            const nameCell = page.getByText(item.name);
            expect(nameCell.elements().length).toBeGreaterThan(0);

            const mainCategoryCell = page.getByText(item.mainCategory);
            expect(mainCategoryCell.elements().length).toBeGreaterThan(0);

            const subCategoryCell = page.getByText(item.subCategory);
            expect(subCategoryCell.elements().length).toBeGreaterThan(0);

            const quantityCell = page.getByText(item.quantity.toString());
            expect(quantityCell.elements().length).toBeGreaterThan(0);
        }
    });

    it("filters items based on search input", async () => {
        const searchInput = page.getByPlaceholder("Search");
        await userEvent.type(searchInput, "Red Bull");

        const redBullRow = page.getByText("Red Bull 250ml");
        expect(redBullRow.elements().length).toBe(1);

        const vodkaRow = page.getByText("Absolut Vodka");
        expect(vodkaRow.elements().length).toBe(0);
    });

    it(`emits "edit-item" event when edit button is clicked`, async () => {
        const editButton = page.getByAltText("Edit Red Bull 250ml");
        expect(editButton.elements().length).toBe(1);

        await userEvent.click(editButton);

        const emittedEvents = screen.emitted("edit-item") as any[];
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[0]);
    });

    it(`emits "delete-item" event when delete button is clicked`, async () => {
        const deleteButton = page.getByAltText("Delete Absolut Vodka");
        expect(deleteButton.elements().length).toBe(1);

        await userEvent.click(deleteButton);

        const emittedEvents = screen.emitted("delete-item") as any[];
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[1]);
    });
});
