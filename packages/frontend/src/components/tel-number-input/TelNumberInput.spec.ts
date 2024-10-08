import type { TelNumberInputProps } from "./TelNumberInput.vue";
import TelNumberInput from "./TelNumberInput.vue";
import { renderComponent } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { last } from "es-toolkit";
import { first } from "es-toolkit/compat";

const AUSTRIA_OPTION = "Austria";

describe("TelNumberInput", () => {
    let props: TelNumberInputProps;

    beforeEach(() => {
        props = {
            modelValue: "",
            required: false,
        };
    });

    describe("when optional", () => {
        it("renders the form with initial values", () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });

            expect.element(countryCodeSelect).toBeVisible();
            expect(countryCodeSelect.query()?.getAttribute("value")).toBe("");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            expect.element(phoneNumberInput).toBeVisible();
            expect(phoneNumberInput.query()?.getAttribute("value")).toBe("");
        });

        it("allows selecting a country code", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            expect(countryCodeSelect.query()?.getAttribute("value")).toBe("Austria");
        });

        it("allows entering a phone number", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "123456789");

            expect(phoneNumberInput.query()?.getAttribute("value")).toBe("123456789");
        });

        it("emits the correct modelValue when a valid phone number is provided", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "2025550123");

            await userEvent.tab();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe(
                "+432025550123",
            );
        });

        it("shows validation error for an invalid phone number", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "123");

            await userEvent.tab();

            const errorMessage = screen.getByText("Invalid phone number");
            expect(errorMessage.query()).toBeTruthy();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe("");
        });

        it("allows leaving both fields empty (optional field)", async () => {
            const screen = renderComponent(TelNumberInput, props);
            const phoneNumberInput = screen.getByLabelText("Phone Number");

            await userEvent.fill(phoneNumberInput, "a");
            await userEvent.fill(phoneNumberInput, "");
            await userEvent.tab();

            const phoneError = screen.getByText(
                "Please provide both country code and phone number",
            );
            const countryError = screen.getByText("Please select a country code");
            expect(countryError.query()).toBeNull();
            expect(phoneError.query()).toBeNull();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(first<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe("");
        });

        // flaky test
        it.skip("shows error when only one field is provided", async () => {
            const screen = renderComponent(TelNumberInput, props);
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });

            // Provide only the country code
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);
            await userEvent.click(phoneNumberInput);

            // Blur to trigger validation
            await userEvent.tab();

            const errorMessage = screen.getByText(
                "Please provide both country code and phone number",
            );
            expect(errorMessage.query()).toBeTruthy();

            // Now clear the country code and provide only the phone number
            const clearButton = screen.getByRole("button", { name: "clear" });
            await userEvent.click(clearButton);

            await userEvent.type(phoneNumberInput, "2025550123");

            await userEvent.tab();

            expect(errorMessage.query()).toBeTruthy();
        });

        it("updates inputs when modelValue prop changes externally", () => {
            const screen = renderComponent(TelNumberInput, {
                modelValue: "+441234567890",
            });

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            expect(countryCodeSelect.query()?.getAttribute("value")).toContain("United Kingdom");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            expect(phoneNumberInput.query()?.getAttribute("value")).toBe("1234567890");
        });

        it("does not emit modelValue when inputs are invalid", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "abc");

            await userEvent.tab();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe("");
        });

        it("formats the phone number correctly on blur", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "7123456789");

            await userEvent.tab();

            expect(phoneNumberInput.query()?.getAttribute("value")).toBe("7123456789");
        });

        // flaky test
        it.skip("handles optional phone number correctly when only country code is cleared", async () => {
            const screen = renderComponent(TelNumberInput, props);

            // Provide both country code and phone number
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "2025550123");

            // Now clear the country code
            const clearButton = document.querySelector("i.q-icon[role='button']");
            await userEvent.click(clearButton!);
            // Blur to trigger validation
            await userEvent.tab();

            const errorMessage = screen.getByText(
                "Please provide both country code and phone number",
            );
            expect(errorMessage.query()).toBeTruthy();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe("");
        });

        // flaky test
        it.skip("allows clearing both fields and emits empty modelValue", async () => {
            const screen = renderComponent(TelNumberInput, props);

            // Provide both country code and phone number
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "2025550123");

            // Now clear both fields
            const clearButton = document.querySelector("i.q-icon[role='button']");
            await userEvent.fill(phoneNumberInput, "");
            await userEvent.click(clearButton!);

            // Blur to trigger validation
            await userEvent.tab();

            // Check that no validation errors are shown
            const countryError = screen.getByText("Please select a country code");
            expect(countryError.query()).toBeNull();

            const phoneError = screen.getByText(
                "Please provide both country code and phone number",
            );
            expect(phoneError.query()).toBeNull();

            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe("");
        });
    });

    describe("when required", () => {
        beforeEach(() => {
            props.required = true;
        });

        it("shows error when both fields are empty", async () => {
            const screen = renderComponent(TelNumberInput, props);

            // Blur to trigger validation
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.click(phoneNumberInput);
            await userEvent.tab();

            expect(
                screen.getByText("Please provide both country code and phone number").query(),
            ).toBeTruthy();

            expect(screen.emitted()["update:modelValue"]).toBeFalsy();
        });

        it("allows entering a valid phone number and emits correct modelValue", async () => {
            const screen = renderComponent(TelNumberInput, props);

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "2025550123");

            await userEvent.tab();

            // Ensure that the modelValue was emitted correctly
            expect(screen.emitted()["update:modelValue"]).toBeTruthy();
            expect(last<string[]>(screen.emitted()["update:modelValue"] as any)[0]).toBe(
                "+432025550123",
            );
        });

        it("shows error when only one field is provided", async () => {
            const screen = renderComponent(TelNumberInput, props);

            // Provide only the country code
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText(AUSTRIA_OPTION);
            await userEvent.click(countryOption);

            // Blur to trigger validation
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.click(phoneNumberInput);
            await userEvent.tab();

            expect(
                screen.getByText("Please provide both country code and phone number").query(),
            ).toBeTruthy();

            // Now clear the country code and provide only the phone number
            const clearButton = screen.getByRole("button", { name: "clear" });
            await userEvent.click(clearButton);
            try {
                await userEvent.click(clearButton);
            } catch (e) {
                /* empty */
            }

            await userEvent.type(phoneNumberInput, "2025550123");

            await userEvent.tab();

            expect(
                screen.getByText("Please provide both country code and phone number").query(),
            ).toBeTruthy();
        });
    });
});
