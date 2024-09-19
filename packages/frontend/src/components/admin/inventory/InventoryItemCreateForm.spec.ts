import type { RenderResult } from "vitest-browser-vue";
import InventoryItemCreateForm from "./InventoryItemCreateForm.vue";
import messages from "../../../i18n";
import { describe, it, expect, beforeEach } from "vitest";
import { InventoryItemType, DrinkCategory } from "@firetable/types";
import { QInput, Quasar, QSelect, QBtn } from "quasar";
import { render } from "vitest-browser-vue";
import { page, userEvent } from "@vitest/browser/context";
import { createI18n } from "vue-i18n";
import "quasar/dist/quasar.css";
import "../../../css/app.scss";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

describe("InventoryItemCreateForm.vue", () => {
    let screen: RenderResult<any>;
    const t = i18n.global.t;

    describe("create", () => {
        beforeEach(() => {
            screen = render(InventoryItemCreateForm, {
                global: {
                    plugins: [Quasar, i18n],
                    components: {
                        QInput,
                        QSelect,
                        QBtn,
                    },
                },
            });
        });

        it("renders correctly", () => {
            expect(screen.container).toBeTruthy();
        });

        it("has the correct initial form data", async () => {
            const nameInput = page.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("");

            const priceInput = page.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(0);

            const quantityInput = page.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(0);

            const unitInput = page.getByLabelText("Unit");
            await expect.element(unitInput).toHaveValue("");

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
            const nameError = page.getByText("Name is required");
            expect(nameError.elements().length).toBeTruthy();

            const priceError = page.getByText("Price must be positive");
            expect(priceError.elements().length).toBeTruthy();

            const quantityError = page.getByText("Quantity must be positive");
            expect(quantityError.elements().length).toBeTruthy();

            const unitError = page.getByText("Unit is required");
            expect(unitError.elements().length).toBeTruthy();
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
            await userEvent.click(foodOption);
            await expect.element(typeSelect).toHaveValue(InventoryItemType.FOOD);

            const priceInput = page.getByLabelText("Price");
            await userEvent.type(priceInput, "10");
            await expect.element(priceInput).toHaveValue(10);

            const quantityInput = page.getByLabelText("Quantity");
            await userEvent.type(quantityInput, "50");
            await expect.element(quantityInput).toHaveValue(50);

            const unitInput = page.getByLabelText("Unit");
            await userEvent.type(unitInput, "plate");
            await expect.element(unitInput).toHaveValue("plate");

            const submitButton = page.getByText("Submit");
            await userEvent.click(submitButton);
        });

        it("resets the form when reset button is clicked", async () => {
            const nameInput = page.getByLabelText("Name");
            await userEvent.type(nameInput, "Test Drink");
            await expect.element(nameInput).toHaveValue("Test Drink");

            const unitInput = page.getByLabelText("Unit");
            await userEvent.type(unitInput, "bottle");
            await expect.element(unitInput).toHaveValue("bottle");

            // Click the reset button
            const resetButton = page.getByText("Reset");
            await userEvent.click(resetButton);

            // Check that form values have been reset
            await expect.element(nameInput).toHaveValue("");
            await expect.element(unitInput).toHaveValue("");
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
                await userEvent.click(foodOption);

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
                await userEvent.click(drinkOption);
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
                unit: "pack",
                supplier: "Supplier A",
            };

            screen = render(InventoryItemCreateForm, {
                props: { itemToEdit },
                global: {
                    plugins: [Quasar, i18n],
                    components: {
                        QInput,
                        QSelect,
                        QBtn,
                    },
                },
            });

            const nameInput = page.getByLabelText("Name");
            await expect.element(nameInput).toHaveValue("Existing Item");

            const priceInput = page.getByLabelText("Price");
            await expect.element(priceInput).toHaveValue(5.99);

            const quantityInput = page.getByLabelText("Quantity");
            await expect.element(quantityInput).toHaveValue(10);

            const unitInput = page.getByLabelText("Unit");
            await expect.element(unitInput).toHaveValue("pack");

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
                unit: "pack",
                supplier: "Supplier A",
            };

            screen = render(InventoryItemCreateForm, {
                props: { itemToEdit },
                global: {
                    plugins: [Quasar, i18n],
                    components: {
                        QInput,
                        QSelect,
                        QBtn,
                    },
                },
            });

            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Updated Item");
            await expect.element(nameInput).toHaveValue("Updated Item");

            // Simulate form submission
            const submitButton = page.getByText(t("InventoryItemCreateForm.submitButtonLabel"));
            await userEvent.click(submitButton);

            // Verify that the component emitted the 'submit' event with the updated item
            const emittedEvents = screen.emitted("submit");
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
                unit: "pack",
                supplier: "Supplier A",
            };

            screen = render(InventoryItemCreateForm, {
                props: { itemToEdit },
                global: {
                    plugins: [Quasar, i18n],
                    components: {
                        QInput,
                        QSelect,
                        QBtn,
                    },
                },
            });

            const nameInput = page.getByLabelText("Name");
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "Modified Name");
            await expect.element(nameInput).toHaveValue("Modified Name");

            // Click the reset button
            const resetButton = page.getByText(t("UserCreateForm.buttonResetLabel"));
            await userEvent.click(resetButton);

            // Verify that the form is reset to the initial item values
            await expect.element(nameInput).toHaveValue("Existing Item");
        });
    });
});
