import type { Locator } from "@vitest/browser/locator";

import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";

import type { AddNewGuestFormProps } from "./AddNewGuestForm.vue";

import { renderComponent } from "../../../../test-helpers/render-component";
import AddNewGuestForm from "./AddNewGuestForm.vue";

describe("AddNewGuestForm", () => {
    function getTagsSelect(screen: any): HTMLElement {
        return screen.getByRole("combobox", { name: "Tags" }).element();
    }

    function getTagRemoveButtons(screen: any): Locator {
        return screen.getByLabelText("Remove");
    }

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
                contact: "+4325550123",
                hashedContact: "75bde53b8d20a110ce8d51d94345d18744e77e72ce3f8ad1d8bcd8fe60092ffc",
                maskedContact: "+43XXXX0123",
                name: "John Doe",
                tags: [],
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
                contact: "+432025550123",
                hashedContact: "06f34ecfe0bd145206f748116d5de65d72ffbd58ac7461d46bfb40b8053e9ec5",
                maskedContact: "+43XXXXXX0123",
                name: "Invalid Contact",
                tags: [],
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

        it("renders empty tags input in create mode", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            await expect.element(tagsSelect).toBeVisible();
            await expect.element(tagsSelect).toHaveValue("");
        });

        it("allows adding new tags by typing and pressing enter", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            // Add first tag
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");

            // Verify chip is created
            const vipChip = screen.getByText("VIP");
            await expect.element(vipChip).toBeVisible();

            // Add second tag
            await userEvent.type(tagsSelect, "Regular");
            await userEvent.keyboard("{Enter}");

            const regularChip = screen.getByText("Regular");
            await expect.element(regularChip).toBeVisible();
        });

        it("allows removing individual tags using remove button", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            // Add two tags
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "Regular");
            await userEvent.keyboard("{Enter}");

            // Get remove buttons and click the first one
            const removeButtons = getTagRemoveButtons(screen);
            expect(removeButtons.all()).toHaveLength(2);
            await userEvent.click(removeButtons.first());

            // Verify first tag is removed but second remains
            await expect.element(screen.getByText("VIP")).not.toBeInTheDocument();
            await expect.element(screen.getByText("Regular")).toBeVisible();
        });

        it("emits create event with correct tags in payload", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);

            // Fill required fields
            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "John Doe");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "25550123");

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText("Austria");
            await userEvent.click(countryOption);

            // Add tags
            const tagsSelect = getTagsSelect(screen);
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "Regular");
            await userEvent.keyboard("{Enter}");

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual({
                contact: "+4325550123",
                hashedContact: "75bde53b8d20a110ce8d51d94345d18744e77e72ce3f8ad1d8bcd8fe60092ffc",
                maskedContact: "+43XXXX0123",
                name: "John Doe",
                tags: ["vip", "regular"],
                visitedProperties: {},
            });
        });

        it("trims whitespace from tags before adding them", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            await userEvent.type(tagsSelect, "  VIP  ");
            await userEvent.keyboard("{Enter}");

            const vipChip = screen.getByText("VIP");
            await expect.element(vipChip).toBeVisible();
        });

        it("prevents duplicate tags from being added", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");

            // Should only find one VIP chip
            const vipChips = document.querySelectorAll(".q-chip");
            expect(vipChips).toHaveLength(1);
        });

        it("handles empty tag input gracefully", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            await userEvent.type(tagsSelect, "   ");
            await userEvent.keyboard("{Enter}");

            // Should not create an empty tag
            const tagChips = document.querySelectorAll(".q-chip");
            expect(tagChips).toHaveLength(0);
        });

        it("handles long tag names appropriately", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            const longTagName = "A".repeat(50);
            await userEvent.type(tagsSelect, longTagName);
            await userEvent.keyboard("{Enter}");

            // Verify the long tag is handled appropriately
            const longTag = screen.getByText(longTagName);
            await expect.element(longTag).toBeVisible();
        });

        it("handles special characters in tags", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            const specialTag = "!@#$%^&*()";
            await userEvent.type(tagsSelect, specialTag);
            await userEvent.keyboard("{Enter}");

            const specialChip = screen.getByText(specialTag);
            await expect.element(specialChip).toBeVisible();
        });

        it("converts tags to lowercase when adding", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            // Adding tags with different cases
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "Regular");
            await userEvent.keyboard("{Enter}");

            // Verify they are converted to lowercase
            const vipChip = screen.getByText("vip");
            const regularChip = screen.getByText("regular");
            await expect.element(vipChip).toBeVisible();
            await expect.element(regularChip).toBeVisible();

            const guestNameInput = screen.getByLabelText("Guest name");
            await userEvent.type(guestNameInput, "John Doe");

            const phoneNumberInput = screen.getByLabelText("Phone Number");
            await userEvent.type(phoneNumberInput, "25550123");

            const countryCodeSelect = screen.getByRole("combobox", { name: "Country Code" });
            await userEvent.click(countryCodeSelect);
            const countryOption = screen.getByText("Austria");
            await userEvent.click(countryOption);

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0].tags).toEqual(["vip", "regular"]);
        });

        it("prevents duplicate tags with different cases", async function (): Promise<void> {
            const screen = renderComponent(AddNewGuestForm, props);
            const tagsSelect = getTagsSelect(screen);

            // Add same tag with different cases
            await userEvent.type(tagsSelect, "VIP");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "vip");
            await userEvent.keyboard("{Enter}");
            await userEvent.type(tagsSelect, "Vip");
            await userEvent.keyboard("{Enter}");

            // Only one chip should exist
            const chips = document.querySelectorAll(".q-chip");
            expect(chips).toHaveLength(1);

            const vipChip = screen.getByText("vip");
            await expect.element(vipChip).toBeVisible();
        });
    });

    describe("edit", () => {
        let props: AddNewGuestFormProps;

        beforeEach(() => {
            props = {
                initialData: {
                    contact: "+431234567890",
                    name: "Existing Guest",
                },
                mode: "edit",
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
                contact: "+432025550123",
                hashedContact: "06f34ecfe0bd145206f748116d5de65d72ffbd58ac7461d46bfb40b8053e9ec5",
                maskedContact: "+43XXXXXX0123",
                name: "Updated Guest",
                tags: [],
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

        it("preserves initial tags in edit mode", async function (): Promise<void> {
            const editProps: AddNewGuestFormProps = {
                initialData: {
                    contact: "+431234567890",
                    name: "Existing Guest",
                    tags: ["VIP", "Regular"],
                },
                mode: "edit",
            };

            const screen = renderComponent(AddNewGuestForm, editProps);

            // Verify initial tags are displayed
            await expect.element(screen.getByText("VIP")).toBeVisible();
            await expect.element(screen.getByText("Regular")).toBeVisible();
        });

        it("allows modifying tags in edit mode", async function (): Promise<void> {
            const editProps: AddNewGuestFormProps = {
                initialData: {
                    contact: "+431234567890",
                    name: "Existing Guest",
                    tags: ["VIP"],
                },
                mode: "edit",
            };

            const screen = renderComponent(AddNewGuestForm, editProps);

            // Add new tag
            const tagsSelect = getTagsSelect(screen);
            await userEvent.type(tagsSelect, "Regular");
            await userEvent.keyboard("{Enter}");

            // Remove existing tag
            const removeButton = getTagRemoveButtons(screen);
            await userEvent.click(removeButton.first());

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            const emitted = screen.emitted().update as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0].tags).toEqual(["regular"]);
        });

        it("maintains tag order in edit mode", function (): void {
            const editProps: AddNewGuestFormProps = {
                initialData: {
                    contact: "+431234567890",
                    name: "Existing Guest",
                    tags: ["First", "Second", "Third"],
                },
                mode: "edit",
            };

            renderComponent(AddNewGuestForm, editProps);

            const chips = Array.from(document.querySelectorAll<HTMLElement>(".q-chip"));
            expect(chips.map((chip) => chip.innerText)).toEqual(["First", "Second", "Third"]);
        });
    });
});
