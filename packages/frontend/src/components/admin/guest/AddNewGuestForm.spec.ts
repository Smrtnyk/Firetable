import type { AddNewGuestFormProps } from "./AddNewGuestForm.vue";
import AddNewGuestForm from "./AddNewGuestForm.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("AddNewGuestForm", () => {
    describe("create", () => {
        let props: AddNewGuestFormProps;

        beforeEach(() => {
            props = {
                mode: "create",
            };
        });

        it("renders the form with initial values", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Check that the guest name input is rendered and empty
            const guestNameInput = screen.getByLabelText("Guest name");
            await expect.element(guestNameInput).toHaveValue("");

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await expect.element(countryCodeSelect).toHaveValue("");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await expect.element(phoneNumberInput).toHaveValue("");
        });

        it("validates guest name input", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Submit the form without entering a guest name
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            // Check for validation error
            const errorMessage = screen.getByText("Guest name must be at least 3 characters long");
            await expect.element(errorMessage).toBeVisible();

            // Enter an invalid guest name
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "Jo");

            // Try submitting again
            await userEvent.click(submitButton);

            // Error should still be present
            await expect.element(errorMessage).toBeVisible();

            // Enter a valid guest name
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "John Doe");

            // Submit the form
            await userEvent.click(submitButton);

            // Error message should no longer be present
            await expect.element(errorMessage).not.toBeInTheDocument();
        });

        it("emits 'create' event with correct payload when form is valid", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Fill in the guest name
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "John Doe");

            // Enter a phone number in the mocked TelNumberInput
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "25550123");
            // Select country code
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText("Austria");
            await userEvent.click(countryOption);

            // Submit the form
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            // Check that the 'create' event was emitted with correct payload
            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual({
                name: "John Doe",
                contact: "+4325550123",
                maskedContact: "+43XXXX0123",
                hashedContact: "75bde53b8d20a110ce8d51d94345d18744e77e72ce3f8ad1d8bcd8fe60092ffc",
                visitedProperties: {},
            });
        });

        it("validates guest contact using TelNumberInput", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "Invalid Contact");

            // Enter invalid phone number
            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "abc");

            // Try to submit the form
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            const phoneError = screen.getByText(
                "Please provide both country code and phone number",
            );
            await expect.element(phoneError).toBeVisible();

            // The form should not emit 'create' because of validation error
            expect(screen.emitted().create).toBeFalsy();

            // Now enter a valid phone number
            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, "2025550123");

            // Select country code
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText("Austria");
            await userEvent.click(countryOption);

            // Submit the form
            await userEvent.click(submitButton);

            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual({
                name: "Invalid Contact",
                contact: "+432025550123",
                maskedContact: "+43XXXXXX0123",
                hashedContact: "06f34ecfe0bd145206f748116d5de65d72ffbd58ac7461d46bfb40b8053e9ec5",
                visitedProperties: {},
            });
        });

        it("validates guest contact when required", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Fill in the guest name
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "John Doe");

            // Leave guest contact empty

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            await expect.element(screen.getByText("Please select a country code")).toBeVisible();

            expect(screen.emitted().create).toBeFalsy();
        });
    });

    describe("edit", () => {
        let props: AddNewGuestFormProps;

        beforeEach(() => {
            props = {
                mode: "edit",
                initialData: {
                    name: "Existing Guest",
                    contact: "+431234567890",
                },
            };
        });

        it("renders the form with initial values", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Check that the guest name input is rendered and has initial value
            const guestNameInput = screen.getByLabelText("Guest name");
            await expect.element(guestNameInput).toHaveValue("Existing Guest");

            // Check that the TelNumberInput component is rendered with initial values
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await expect.element(countryCodeSelect).toHaveValue("Austria");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await expect.element(phoneNumberInput).toHaveValue("1234567890");
        });

        it("emits 'update' event with correct payload when form is valid", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Modify the guest name
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Updated Guest");

            // Modify the guest contact
            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText("Austria");
            await userEvent.click(countryOption);

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, "2025550123");

            // Submit the form
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            // Check that the 'update' event was emitted with correct payload
            const emitted = screen.emitted().update as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual({
                name: "Updated Guest",
                contact: "+432025550123",
                maskedContact: "+43XXXXXX0123",
                hashedContact: "06f34ecfe0bd145206f748116d5de65d72ffbd58ac7461d46bfb40b8053e9ec5",
                visitedProperties: {},
            });
        });

        it("validates guest name input in edit mode", async () => {
            const screen = renderComponent(AddNewGuestForm, props);

            // Clear the guest name
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.clear(guestNameInput);

            // Submit the form
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            // Check for validation error
            const errorMessage = screen.getByText("Guest name must be at least 3 characters long");
            await expect.element(errorMessage).toBeVisible();

            // Enter a valid guest name
            await userEvent.type(guestNameInput, "Valid Name");

            await userEvent.click(submitButton);

            // Error message should no longer be present
            await expect.element(errorMessage).not.toBeInTheDocument();
        });
    });
});
