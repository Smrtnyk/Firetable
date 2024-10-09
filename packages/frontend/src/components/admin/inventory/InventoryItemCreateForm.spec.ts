import type { RenderResult } from "vitest-browser-vue";
import type { CreateInventoryItemPayload } from "@firetable/types";
import InventoryItemCreateForm from "./InventoryItemCreateForm.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { DrinkCategory, InventoryItemType } from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "@vitest/browser/context";

describe("InventoryItemCreateForm.vue", () => {
    let screen: RenderResult<any>;

    describe("create", () => {
        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm);
        });

        it("has the correct initial form data", async () => {
            const nameInput = page.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("");

            const priceInput = page.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(0);

            const quantityInput = page.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);

            const supplierInput = page.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("");

            const alcoholContentInput = page.getByLabelText("Alcohol Content");
            await expect.element(alcoholContentInput).toHaveValue(null);

            const volumeInput = page.getByLabelText("Volume");
            await expect.element(volumeInput).toHaveValue(null);
            // It is the nested one
            const typeSelect = page.getByLabelText("Type").getByLabelText("Type");
            await expect.element(typeSelect).toHaveValue(InventoryItemType.DRINK);

            const categorySelect = page.getByLabelText("Category");
            await expect.element(categorySelect).toHaveValue(DrinkCategory.SPIRIT);
        });

        it("shows validation errors when required fields are empty", async () => {
            // Try to submit the form without filling required fields
            const submitButton = page.getByText("Submit");
            await userEvent.click(submitButton);

            // Check for validation error messages
            await expect.element(page.getByText("Name is required")).toBeVisible();
            await expect.element(page.getByText("Price must be positive")).toBeVisible();
            await expect.element(page.getByText("Quantity must be positive")).toBeVisible();
        });

        it("emits submit event with correct data when form is valid", async () => {
            const nameInput = page.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Drink");
            await expect.element(nameInput).toHaveValue("Test Drink");

            const typeSelect = page.getByLabelText("Type").getByLabelText("Type");
            await userEvent.click(typeSelect);
            // sleep for 100ms
            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
            const options = document.querySelectorAll(".q-menu .q-item");
            const foodOption = Array.from(options).find(
                (option) => option.textContent?.trim() === InventoryItemType.FOOD,
            );

            expect(foodOption).toBeTruthy();
            await userEvent.click(foodOption!);
            await expect.element(typeSelect).toHaveValue(InventoryItemType.FOOD);

            const priceInput = page.getByLabelText("Price");
            await userEvent.type(priceInput, "10");
            await expect.element(priceInput).toHaveValue(10);

            const quantityInput = page.getByLabelText("Quantity");
            await userEvent.type(quantityInput, "50");
            await expect.element(quantityInput).toHaveValue(50);

            const submitButton = page.getByText("Submit");
            await userEvent.click(submitButton);
        });

        it("resets the form when reset button is clicked", async () => {
            const nameInput = page.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Drink");
            await expect.element(nameInput).toHaveValue("Test Drink");

            // Click the reset button
            const resetButton = page.getByText("Reset");
            await userEvent.click(resetButton);

            // Check that form values have been reset
            await expect.element(nameInput).toHaveValue("");
        });

        it("conditionally shows alcohol content and volume fields when type is drink", async () => {
            const alcoholContentInput = page.getByLabelText("Alcohol Content");
            const volumeInput = page.getByLabelText("Volume");

            await expect.element(alcoholContentInput).toBeVisible();
            await expect.element(volumeInput).toBeVisible();

            const typeSelect = page.getByLabelText("Type").getByLabelText("Type");
            {
                // Change type to 'food'
                await userEvent.click(typeSelect);
                // sleep for 100ms
                await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                });
                // Select 'Food' from the dropdown options
                const options = document.querySelectorAll(".q-menu .q-item");
                const foodOption = Array.from(options).find(
                    (option) => option.textContent?.trim() === InventoryItemType.FOOD,
                );

                expect(foodOption).toBeTruthy();
                await userEvent.click(foodOption!);

                // Check that 'Alcohol Content' and 'Volume' inputs are no longer present
                const alcoholContentInputAfter = page.getByLabelText("Alcohol Content");
                const volumeInputAfter = page.getByLabelText("Volume");

                expect(alcoholContentInputAfter.elements().length).toBe(0);
                expect(volumeInputAfter.elements().length).toBe(0);
            }

            {
                // Change type back to 'drink'
                await userEvent.click(typeSelect);
                const options = document.querySelectorAll(".q-menu .q-item");
                const drinkOption = Array.from(options).find(
                    (option) => option.textContent?.trim() === InventoryItemType.DRINK,
                );

                expect(drinkOption).toBeTruthy();
                await userEvent.click(drinkOption!);
                // Check that 'Alcohol Content' and 'Volume' inputs are present again
                const alcoholContentInputAgain = page.getByLabelText("Alcohol Content");
                const volumeInputAgain = page.getByLabelText("Volume");

                expect(alcoholContentInputAgain.elements().length).toBeGreaterThan(0);
                expect(volumeInputAgain.elements().length).toBeGreaterThan(0);
            }
        });
    });

    describe("edit", () => {
        it("prefills form when itemToEdit prop is provided", async () => {
            const itemToEdit = {
                name: "Existing Item",
                type: InventoryItemType.FOOD,
                category: "Snacks",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = page.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Existing Item");

            const priceInput = page.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(5.99);

            const quantityInput = page.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(10);

            const supplierInput = page.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("Supplier A");

            const typeSelect = page.getByLabelText("Type").getByLabelText("Type");
            await expect.element(typeSelect).toHaveValue(InventoryItemType.FOOD);

            const categoryInput = page.getByLabelText("Category");
            await expect.element(categoryInput).toHaveValue("Snacks");
        });

        it("emits submit event with updated item including id when editing", async () => {
            const itemToEdit = {
                name: "Existing Item",
                type: InventoryItemType.FOOD,
                category: "Snacks",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Updated Item");
            await expect.element(nameInput).toHaveValue("Updated Item");

            // Simulate form submission
            const submitButton = page.getByText(t("Global.submit"));
            await userEvent.click(submitButton);

            // Verify that the component emitted the 'submit' event with the updated item
            const emittedEvents = screen.emitted("submit") as any[];
            expect(emittedEvents).toBeTruthy();
            expect(emittedEvents.length).toBe(1);
            const submittedItem = emittedEvents[0][0];
            expect(submittedItem).toStrictEqual({
                ...itemToEdit,
                name: "Updated Item",
            });
        });

        it("resets form to initial item when reset button is clicked while editing", async () => {
            const itemToEdit = {
                name: "Existing Item",
                type: InventoryItemType.FOOD,
                category: "Snacks",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");
            await expect.element(nameInput).toHaveValue("Modified Name");

            // Click the reset button
            const resetButton = page.getByText(t("Global.reset"));
            await userEvent.click(resetButton);

            // Verify that the form is reset to the initial item values
            await expect.element(nameInput).toHaveValue("Existing Item");
        });
    });

    describe("initialData", () => {
        const initialData: CreateInventoryItemPayload = {
            name: "Red Bull 250ml",
            type: InventoryItemType.DRINK,
            category: DrinkCategory.SOFT_DRINK,
            price: 0,
            quantity: 0,
            supplier: "Red Bull,Orginal",
            alcoholContent: 0,
            volume: 250,
        };

        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm, { initialData });
        });

        it("prefills form when initialData prop is provided", async () => {
            const nameInput = page.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Red Bull 250ml");

            const typeSelect = page.getByLabelText("Type").getByLabelText("Type");
            await expect.element(typeSelect).toHaveValue(InventoryItemType.DRINK);

            const categoryInput = page.getByLabelText("Category");
            await expect.element(categoryInput).toHaveValue(DrinkCategory.SOFT_DRINK);

            const priceInput = page.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(0);

            const quantityInput = page.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);

            const supplierInput = page.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("Red Bull,Orginal");

            const alcoholContentInput = page.getByLabelText("Alcohol Content");
            await expect.element(alcoholContentInput).toHaveValue(0);

            const volumeInput = page.getByLabelText("Volume");
            await expect.element(volumeInput).toHaveValue(250);
        });

        it("emits submit event with correct data when initialData is provided and form is submitted", async () => {
            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Red Bull Sugarfree 250ml");

            await expect.element(nameInput).toHaveValue("Red Bull Sugarfree 250ml");

            const priceInput = page.getByLabelText("Price");
            await userEvent.type(priceInput, "2.5");

            const quantityInput = page.getByLabelText("Quantity");
            await userEvent.type(quantityInput, "10");

            const submitButton = page.getByText(t("Global.submit"));
            await userEvent.click(submitButton);

            const emittedEvents = screen.emitted("submit") as any[];
            expect(emittedEvents).toBeTruthy();
            expect(emittedEvents.length).toBe(1);
            const submittedItem = emittedEvents[0][0];
            expect(submittedItem).toStrictEqual({
                ...initialData,
                price: 2.5,
                quantity: 10,
                name: "Red Bull Sugarfree 250ml",
            });
        });

        it("resets form to initial data when reset button is clicked", async () => {
            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");
            await expect.element(nameInput).toHaveValue("Modified Name");

            const resetButton = page.getByText(t("Global.reset") || "Reset");
            await userEvent.click(resetButton);

            await expect.element(nameInput).toHaveValue("Red Bull 250ml");
        });
    });
});
