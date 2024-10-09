import type { UserCreateFormProps } from "./UserCreateForm.vue";
import type { PropertyDoc } from "@firetable/types";
import UserCreateForm from "./UserCreateForm.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { ADMIN, Role } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { first } from "es-toolkit/compat";

const { showErrorMessageSpy } = vi.hoisted(() => {
    return { showErrorMessageSpy: vi.fn() };
});

vi.mock("src/helpers/ui-helpers", () => ({
    showErrorMessage: showErrorMessageSpy,
}));

describe("UserCreateForm", () => {
    let props: UserCreateFormProps;
    const user = {
        role: Role.MANAGER,
    };

    beforeEach(() => {
        props = {
            properties: [
                { id: "property1", name: "Property 1" } as PropertyDoc,
                { id: "property2", name: "Property 2" } as PropertyDoc,
            ],
            organisation: {
                id: "org1",
                name: "TestOrg",
                maxAllowedProperties: 2,
            },
        };
        showErrorMessageSpy.mockClear();
    });

    it("renders the form with initial values", () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
        });

        expect(
            screen
                .getByLabelText(t("UserCreateForm.userNameInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");

        expect(
            screen
                .getByLabelText(t("UserCreateForm.userMailInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");

        expect(
            screen
                .getByLabelText(t("UserCreateForm.userPasswordInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");

        // Role select should be rendered and default to Role.STAFF
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        expect(roleSelect.query()).toBeTruthy();
        expect(roleSelect.query()?.getAttribute("aria-label")).toBe(
            t("UserCreateForm.userRoleSelectLabel"),
        );

        // Properties checkboxes should be rendered (since we have properties and role is not PROPERTY_OWNER)
        const propertyCheckboxes = screen.getByRole("checkbox");
        expect(propertyCheckboxes.elements().length).toBe(2);

        // Ensure checkboxes are unchecked
        for (const checkbox of propertyCheckboxes.elements()) {
            expect(checkbox.getAttribute("aria-checked")).toBe("false");
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

        expect(screen.getByText("Please type something").elements().length).toBeGreaterThanOrEqual(
            2,
        );
    });

    it("shows error when no properties are selected", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user },
                },
            },
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

        // Check that showErrorMessage is called for properties selection
        expect(showErrorMessageSpy).toHaveBeenCalledWith("You must select at least one property!");
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
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Select properties
        const propertyCheckboxes = screen.getByRole("checkbox");
        // Select first property
        await userEvent.click(propertyCheckboxes.elements()[0]);

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        // Check that the 'submit' event was emitted with correct payload
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            name: "Test User",
            username: "testuser",
            password: "Passwor!d123",
            role: Role.MANAGER,
            // emailSuffix is '@TestOrg.at'
            email: "testuser@TestOrg.at",
            organisationId: "org1",
            relatedProperties: ["property1"],
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
        await userEvent.click(propertyCheckboxes.elements()[0]);

        const resetButton = screen.getByRole("button", { name: t("Global.reset") });
        await userEvent.click(resetButton);

        expect(
            screen
                .getByLabelText(t("UserCreateForm.userNameInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");
        expect(
            screen
                .getByLabelText(t("UserCreateForm.userMailInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");
        expect(
            screen
                .getByLabelText(t("UserCreateForm.userPasswordInputLabel"))
                .query()
                ?.getAttribute("value"),
        ).toBe("");

        // Check that properties are reset
        for (const checkbox of propertyCheckboxes.elements()) {
            expect(checkbox.getAttribute("aria-checked")).toBe("false");
        }
    });

    it("does not show properties selection when role is PROPERTY_OWNER", async () => {
        const screen = renderComponent(UserCreateForm, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: { user: { ...user, role: ADMIN } },
                },
            },
        });

        // Select role PROPERTY_OWNER
        const roleSelect = screen.getByLabelText(t("UserCreateForm.userRoleSelectLabel"));
        await userEvent.click(roleSelect);
        const propertyOwnerOption = screen.getByRole("option", { name: Role.PROPERTY_OWNER });
        await userEvent.click(propertyOwnerOption);

        // Check that properties selection is not displayed
        const propertyCheckboxes = screen.getByRole("checkbox");
        expect(propertyCheckboxes.elements().length).toBe(0);
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

        expect
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

        expect(
            screen.getByText("Password must include at least one uppercase letter.").query(),
        ).toBeTruthy();

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // No number, or symbol
            "Password",
        );

        await userEvent.click(submitButton);

        expect(screen.getByText("Password must include at least one number.").query()).toBeTruthy();

        await userEvent.fill(
            screen.getByLabelText(t("UserCreateForm.userPasswordInputLabel")),
            // No symbol
            "Password1",
        );

        await userEvent.click(submitButton);

        expect(
            screen
                .getByText(
                    "Password must include at least one special character (e.g., !, #, etc...)",
                )
                .query(),
        ).toBeTruthy();
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
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Select properties
        const propertyCheckboxes = screen.getByRole("checkbox");
        // Select first property
        await userEvent.click(propertyCheckboxes.elements()[0]);

        const submitButton = screen.getByRole("button", { name: t("Global.submit") });
        await userEvent.click(submitButton);

        // Check that the 'submit' event was emitted with correct payload
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            name: "Test User",
            username: "testuser",
            password: "Password123!",
            role: Role.MANAGER,
            // emailSuffix is '@TestOrg.at'
            email: "testuser@TestOrg.at",
            organisationId: "org1",
            relatedProperties: ["property1"],
        });
    });
});
