import type { CreateInventoryItemPayload } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import {
    DrinkMainCategory,
    InventoryItemType,
    NonAlcoholicCategory,
    SpiritSubCategory,
} from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";

import type { InventoryItemCreateFormProps } from "./InventoryItemCreateForm.vue";

import { renderComponent, t } from "../../../../test-helpers/render-component";
import InventoryItemCreateForm from "./InventoryItemCreateForm.vue";

describe("InventoryItemCreateForm.vue", () => {
    let screen: RenderResult<InventoryItemCreateFormProps>;

    describe("create", () => {
        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm);
        });

        it("has the correct initial form data", async () => {
            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("");

            const typeSelect = screen.getByLabelText("Type");
            await expect.element(typeSelect).toHaveValue(InventoryItemType.DRINK);

            const mainCategorySelect = screen.getByLabelText("Main Category");
            await expect.element(mainCategorySelect).toHaveValue(DrinkMainCategory.SPIRITS);

            const subCategorySelect = screen.getByLabelText("Sub Category");
            await expect.element(subCategorySelect).toHaveValue(SpiritSubCategory.VODKA);

            const quantityInput = screen.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);
        });

        it("shows validation errors when required fields are empty", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);

            const submitButton = screen.getByText(t("Global.submit"));
            await userEvent.click(submitButton);

            await expect.element(screen.getByText(t("validation.nameRequired"))).toBeVisible();
        });

        it("emits submit event with correct data when form is valid", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Vodka");

            const quantityInput = screen.getByLabelText("Quantity");
            await userEvent.clear(quantityInput);
            await userEvent.type(quantityInput, "50");

            const volumeInput = screen.getByLabelText("Volume (ml)");
            await userEvent.type(volumeInput, "700");

            const submitButton = screen.getByText(t("Global.submit"));
            await userEvent.click(submitButton);

            const emittedEvents = screen.emitted("submit") as any[];
            expect(emittedEvents).toBeTruthy();
            expect(emittedEvents.length).toBe(1);

            const submittedItem = emittedEvents[0][0];
            expect(submittedItem).toStrictEqual({
                isActive: true,
                mainCategory: DrinkMainCategory.SPIRITS,
                name: "Test Vodka",
                quantity: 50,
                subCategory: SpiritSubCategory.VODKA,
                supplier: "",
                type: InventoryItemType.DRINK,
                volume: 700,
            });
        });
    });

    describe("edit", () => {
        const itemToEdit: CreateInventoryItemPayload = {
            isActive: true,
            mainCategory: DrinkMainCategory.NON_ALCOHOLIC,
            name: "Red Bull",
            quantity: 10,
            subCategory: NonAlcoholicCategory.ENERGY_DRINK,
            supplier: "Red Bull GmbH",
            type: InventoryItemType.DRINK,
            volume: 250,
        };

        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });
        });

        it("prefills form when itemToEdit prop is provided", async () => {
            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Red Bull");

            const mainCategorySelect = screen.getByLabelText("Main Category");
            await expect.element(mainCategorySelect).toHaveValue(DrinkMainCategory.NON_ALCOHOLIC);

            const subCategorySelect = screen.getByLabelText("Sub Category");
            await expect.element(subCategorySelect).toHaveValue(NonAlcoholicCategory.ENERGY_DRINK);

            const quantityInput = screen.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(10);

            const volumeInput = screen.getByLabelText("Volume (ml)");
            await expect.element(volumeInput).toHaveValue(250);
        });

        it("emits submit event with updated data", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Red Bull Sugar Free");

            const submitButton = screen.getByText(t("Global.submit"));
            await userEvent.click(submitButton);

            const emittedEvents = screen.emitted("submit") as any[];
            expect(emittedEvents).toBeTruthy();
            expect(emittedEvents.length).toBe(1);

            const submittedItem = emittedEvents[0][0];
            expect(submittedItem).toStrictEqual({
                ...itemToEdit,
                name: "Red Bull Sugar Free",
            });
        });
    });

    describe("initialData", () => {
        const initialData: CreateInventoryItemPayload = {
            isActive: true,
            mainCategory: DrinkMainCategory.NON_ALCOHOLIC,
            name: "Red Bull",
            quantity: 0,
            subCategory: NonAlcoholicCategory.ENERGY_DRINK,
            supplier: "Red Bull GmbH",
            type: InventoryItemType.DRINK,
            volume: 250,
        };

        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm, { initialData });
        });

        it("prefills form with initialData", async () => {
            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Red Bull");

            const volumeInput = screen.getByLabelText("Volume (ml)");
            await expect.element(volumeInput).toHaveValue(250);
        });

        it("resets to initialData when reset button is clicked", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");

            const resetButton = screen.getByText(t("Global.reset"));
            await userEvent.click(resetButton);

            await expect.element(nameInput).toHaveValue("Red Bull");
        });
    });
});
