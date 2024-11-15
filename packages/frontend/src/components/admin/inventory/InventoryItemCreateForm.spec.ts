import type { RenderResult } from "vitest-browser-vue";
import type { CreateInventoryItemPayload } from "@firetable/types";
import type { InventoryItemCreateFormProps } from "./InventoryItemCreateForm.vue";
import InventoryItemCreateForm from "./InventoryItemCreateForm.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { DrinkCategory, InventoryItemType } from "@firetable/types";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("InventoryItemCreateForm.vue", () => {
    let screen: RenderResult<InventoryItemCreateFormProps>;

    describe("create", () => {
        beforeEach(() => {
            screen = renderComponent(InventoryItemCreateForm);
        });

        it("has the correct initial form data", async () => {
            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("");

            const priceInput = screen.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(0);

            const quantityInput = screen.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);

            const supplierInput = screen.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("");

            const alcoholContentInput = screen.getByLabelText("Alcohol Content");
            await expect.element(alcoholContentInput).toHaveValue(null);

            const volumeInput = screen.getByLabelText("Volume");
            await expect.element(volumeInput).toHaveValue(null);

            const options = screen.getByRole("combobox", {
                includeHidden: false,
                expanded: false,
            });
            await expect.element(options).toHaveValue(InventoryItemType.DRINK);

            const categorySelect = screen.getByLabelText("Category");
            await expect.element(categorySelect).toHaveValue(DrinkCategory.SPIRIT);
        });

        it("shows validation errors when required fields are empty", async () => {
            // Try to submit the form without filling required fields
            const submitButton = screen.getByText("Submit");
            await userEvent.click(submitButton);

            // Check for validation error messages
            await expect.element(screen.getByText("Name is required")).toBeVisible();
            await expect.element(screen.getByText("Price must be positive")).toBeVisible();
            await expect.element(screen.getByText("Quantity must be positive")).toBeVisible();
        });

        it("emits submit event with correct data when form is valid", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Drink");
            await expect.element(nameInput).toHaveValue("Test Drink");

            const options = screen.getByRole("combobox", {
                includeHidden: false,
                expanded: false,
            });
            await expect.element(options).toHaveValue(InventoryItemType.DRINK);

            const priceInput = screen.getByLabelText("Price");
            await userEvent.type(priceInput, "10");
            await expect.element(priceInput).toHaveValue(10);

            const quantityInput = screen.getByLabelText("Quantity");
            await userEvent.type(quantityInput, "50");
            await expect.element(quantityInput).toHaveValue(50);

            const submitButton = screen.getByText("Submit");
            await userEvent.click(submitButton);
        });

        it("resets the form when reset button is clicked", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Drink");
            await expect.element(nameInput).toHaveValue("Test Drink");

            // Click the reset button
            const resetButton = screen.getByText("Reset");
            await userEvent.click(resetButton);

            // Check that form values have been reset
            await expect.element(nameInput).toHaveValue("");
        });
    });

    describe("edit", () => {
        it("prefills form when itemToEdit prop is provided", async () => {
            const itemToEdit = {
                name: "Existing Item",
                type: InventoryItemType.DRINK,
                category: "Snacks",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Existing Item");

            const priceInput = screen.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(5.99);

            const quantityInput = screen.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(10);

            const supplierInput = screen.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("Supplier A");

            const options = screen.getByRole("combobox", {
                includeHidden: false,
                expanded: false,
            });
            await expect.element(options).toHaveValue(InventoryItemType.DRINK);

            const categoryInput = screen.getByLabelText("Category");
            await expect.element(categoryInput).toHaveValue("Snacks");
        });

        it("emits submit event with updated item including id when editing", async () => {
            const itemToEdit = {
                name: "Existing Item",
                type: InventoryItemType.DRINK,
                category: "Beer",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Updated Item");
            await expect.element(nameInput).toHaveValue("Updated Item");

            // Simulate form submission
            const submitButton = screen.getByText(t("Global.submit"));
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
                type: InventoryItemType.DRINK,
                category: "Snacks",
                price: 5.99,
                quantity: 10,
                supplier: "Supplier A",
            };

            screen = renderComponent(InventoryItemCreateForm, { itemToEdit });

            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");
            await expect.element(nameInput).toHaveValue("Modified Name");

            // Click the reset button
            const resetButton = screen.getByText(t("Global.reset"));
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
            const nameInput = screen.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Red Bull 250ml");

            const options = screen.getByRole("combobox", {
                includeHidden: false,
                expanded: false,
            });
            await expect.element(options).toHaveValue(InventoryItemType.DRINK);

            const categoryInput = screen.getByLabelText("Category");
            await expect.element(categoryInput).toHaveValue(DrinkCategory.SOFT_DRINK);

            const priceInput = screen.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(0);

            const quantityInput = screen.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);

            const supplierInput = screen.getByLabelText("Supplier");
            await expect.element(supplierInput).toHaveValue("Red Bull,Orginal");

            const alcoholContentInput = screen.getByLabelText("Alcohol Content");
            await expect.element(alcoholContentInput).toHaveValue(0);

            const volumeInput = screen.getByLabelText("Volume");
            await expect.element(volumeInput).toHaveValue(250);
        });

        it("emits submit event with correct data when initialData is provided and form is submitted", async () => {
            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Red Bull Sugarfree 250ml");

            await expect.element(nameInput).toHaveValue("Red Bull Sugarfree 250ml");

            const priceInput = screen.getByLabelText("Price");
            await userEvent.type(priceInput, "2.5");

            const quantityInput = screen.getByLabelText("Quantity");
            await userEvent.type(quantityInput, "10");

            const submitButton = screen.getByText(t("Global.submit"));
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
            const nameInput = screen.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");
            await expect.element(nameInput).toHaveValue("Modified Name");

            const resetButton = screen.getByText(t("Global.reset") || "Reset");
            await userEvent.click(resetButton);

            await expect.element(nameInput).toHaveValue("Red Bull 250ml");
        });
    });
});
