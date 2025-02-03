import type { InventoryItemDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import {
    DrinkMainCategory,
    InventoryItemType,
    NonAlcoholicCategory,
    SpiritSubCategory,
} from "@firetable/types";
import { page, userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";

import { renderComponent } from "../../../../test-helpers/render-component";
import InventoryTable from "./InventoryTable.vue";

const sampleItems: InventoryItemDoc[] = [
    {
        id: "1",
        isActive: true,
        mainCategory: DrinkMainCategory.NON_ALCOHOLIC,
        name: "Red Bull 250ml",
        quantity: 50,
        subCategory: NonAlcoholicCategory.ENERGY_DRINK,
        supplier: "Red Bull GmbH",
        type: InventoryItemType.DRINK,
        volume: 250,
    },
    {
        alcoholContent: 40,
        id: "2",
        isActive: true,
        mainCategory: DrinkMainCategory.SPIRITS,
        name: "Absolut Vodka",
        quantity: 100,
        subCategory: SpiritSubCategory.VODKA,
        supplier: "Pernod Ricard",
        type: InventoryItemType.DRINK,
        volume: 700,
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
            expect(nameCell.all().length).toBeGreaterThan(0);

            const mainCategoryCell = page.getByText(item.mainCategory);
            expect(mainCategoryCell.all().length).toBeGreaterThan(0);

            const subCategoryCell = page.getByText(item.subCategory);
            expect(subCategoryCell.all().length).toBeGreaterThan(0);

            const quantityCell = page.getByText(item.quantity.toString());
            expect(quantityCell.all().length).toBeGreaterThan(0);
        }
    });

    it("filters items based on search input", async () => {
        const searchInput = page.getByPlaceholder("Search");
        await userEvent.type(searchInput, "Red Bull");

        const redBullRow = page.getByText("Red Bull 250ml");
        expect(redBullRow.all()).toHaveLength(1);

        const vodkaRow = page.getByText("Absolut Vodka");
        expect(vodkaRow.all()).toHaveLength(0);
    });

    it(`emits "edit-item" event when edit button is clicked`, async () => {
        const editButton = page.getByAltText("Edit Red Bull 250ml");
        expect(editButton.all()).toHaveLength(1);

        await userEvent.click(editButton);

        const emittedEvents = screen.emitted("edit-item") as any[];
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[0]);
    });

    it(`emits "delete-item" event when delete button is clicked`, async () => {
        const deleteButton = page.getByAltText("Delete Absolut Vodka");
        expect(deleteButton.all()).toHaveLength(1);

        await userEvent.click(deleteButton);

        const emittedEvents = screen.emitted("delete-item") as any[];
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents.length).toBe(1);
        expect(emittedEvents[0][0]).toStrictEqual(sampleItems[1]);
    });
});
