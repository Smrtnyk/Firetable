import type { PropertyDoc } from "@firetable/types";

import { AdminRole, OrganisationStatus, Role } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { first } from "es-toolkit/compat";
import { beforeEach, describe, expect, it } from "vitest";

import type { UserCreateFormProps } from "./UserCreateForm.vue";

import { renderComponent, t } from "../../../../test-helpers/render-component";
import UserCreateForm from "./UserCreateForm.vue";

describe("UserCreateForm", () => {
    let props: UserCreateFormProps;
    const user = {
        role: Role.MANAGER,
    };

    beforeEach(() => {
        props = {
            organisation: {
                id: "org1",
                maxAllowedProperties: 2,
                name: "TestOrg",
                status: OrganisationStatus.ACTIVE,
            },
            properties: [
                { id: "property1", name: "Property 1" } as PropertyDoc,
                { id: "property2", name: "Property 2" } as PropertyDoc,
            ],
        };
    });

    it("renders the form with initial values", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userNameInputLabel")))
            .toHaveValue("");

        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userMailInputLabel")))
            .toHaveValue("");

        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")))
            .toHaveValue("");

        // Role select should be rendered and default to Role.STAFF
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        await expect.element(roleSelect).toHaveValue(Role.STAFF);

        // Properties checkboxes should be rendered (since we have properties and role is not PROPERTY_OWNER)
        const propertyCheckboxes = screen.getByRole("checkbox");
        expect(propertyCheckboxes.all()).toHaveLength(2);

        // Ensure checkboxes are unchecked
        for (const checkbox of propertyCheckboxes.all()) {
            await expect.element(checkbox).not.toBeChecked();
        }
    });

    it("validates required fields", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        expect(screen.getByText("Please type something").all().length).toBeGreaterThanOrEqual(2);
    });

    it("shows error when no properties are selected", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            includeGlobalComponents: true,
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
            wrapInLayout: true,
        });

        // Fill out required fields
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            "Passwor!d123",
        );

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        await expect
            .element(screen.getByText("You must select at least one property for this role!"))
            .toBeVisible();
    });

    it("emits submit event with correct payload", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        // Fill out the form fields
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            "Passwor!d123",
        );

        // Select role
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        await userEvent.click(roleSelect, { force: true });
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Select properties
        const propertyCheckboxes = screen.getByRole("checkbox");
        // Select first property
        await userEvent.click(propertyCheckboxes.first());

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        // Check that the 'submit' event was emitted with correct payload
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            // emailSuffix is '@TestOrg.org'
            email: "testuser@TestOrg.org",
            name: "Test User",
            organisationId: "org1",
            password: "Passwor!d123",
            relatedProperties: ["property1"],
            role: Role.MANAGER,
            username: "testuser",
        });
    });

    it("resets the form when reset button is clicked", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        // Fill out the form fields
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            "password123",
        );

        const propertyCheckboxes = screen.getByRole("checkbox");
        await userEvent.click(propertyCheckboxes.first());

        const resetButton = screen.getByRole("button", { name: t("Global.reset") });
        await userEvent.click(resetButton);

        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userNameInputLabel")))
            .toHaveValue("");
        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userMailInputLabel")))
            .toHaveValue("");
        await expect
            .element(screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")))
            .toHaveValue("");

        // Check that properties are reset
        for (const checkbox of propertyCheckboxes.all()) {
            await expect.element(checkbox).not.toBeChecked();
        }
    });

    it("does not show properties selection when role is PROPERTY_OWNER", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user: { ...user, role: AdminRole.ADMIN } },
                },
            },
        });

        // Select role PROPERTY_OWNER
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        await userEvent.click(roleSelect, { force: true });
        const propertyOwnerOption = screen.getByRole("option", { name: Role.PROPERTY_OWNER });
        await userEvent.click(propertyOwnerOption);

        // Check that properties selection is not displayed
        const propertyCheckboxes = screen.getByRole("checkbox");
        expect(propertyCheckboxes.all()).toHaveLength(0);
    });

    it("validates that password is not empty", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        await expect.element(screen.getByText("Password is required.")).toBeVisible();
    });

    it("validates that password meets minimum length", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // Short password
            "123",
        );

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        await expect
            .element(screen.getByText("Password must be at least 6 characters long."))
            .toBeVisible();
    });

    it("validates that password includes at least one uppercase letter, one number, and one symbol", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // No uppercase, number, or symbol
            "password",
        );

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        await expect
            .element(screen.getByText("Password must include at least one uppercase letter."))
            .toBeVisible();

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // No number, or symbol
            "Password",
        );

        await userEvent.click(submitButton);

        await expect
            .element(screen.getByText("Password must include at least one number."))
            .toBeVisible();

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // No symbol
            "Password1",
        );

        await userEvent.click(submitButton);

        await expect
            .element(
                screen.getByText(
                    "Password must include at least one special character (e.g., !, #, etc...)",
                ),
            )
            .toBeVisible();
    });

    it("emits submit event when password meets all validation rules", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userNameInputLabel")),
            "Test User",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userMailInputLabel")),
            "testuser",
        );
        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // Valid password
            "Password123!",
        );

        // Select role
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        await userEvent.click(roleSelect, { force: true });
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Select properties
        const propertyCheckboxes = screen.getByRole("checkbox");
        // Select first property
        await userEvent.click(propertyCheckboxes.first());

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        // Check that the 'submit' event was emitted with correct payload
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            // emailSuffix is '@TestOrg.org'
            email: "testuser@TestOrg.org",
            name: "Test User",
            organisationId: "org1",
            password: "Password123!",
            relatedProperties: ["property1"],
            role: Role.MANAGER,
            username: "testuser",
        });
    });
});
