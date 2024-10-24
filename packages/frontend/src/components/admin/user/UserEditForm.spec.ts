import type { UserEditFormProps } from "./UserEditForm.vue";
import type { PropertyDoc } from "@firetable/types";
import UserEditForm from "./UserEditForm.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { Role, DEFAULT_CAPABILITIES_BY_ROLE, UserCapability } from "@firetable/types";
import { describe, it, beforeEach, expect } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { first } from "es-toolkit/compat";

describe("UserEditForm", () => {
    let props: UserEditFormProps;

    beforeEach(() => {
        props = {
            user: {
                id: "user1",
                name: "John Doe",
                email: "johndoe@TestOrg.org",
                username: "johndoe",
                role: Role.STAFF,
                relatedProperties: ["property1"],
                organisationId: "org1",
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
            },
            properties: [
                { id: "property1", name: "Property 1" } as PropertyDoc,
                { id: "property2", name: "Property 2" } as PropertyDoc,
            ],
            selectedProperties: [{ id: "property1", name: "Property 1" } as PropertyDoc],
            organisation: {
                id: "org1",
                name: "TestOrg",
                maxAllowedProperties: 2,
            },
        };
    });

    it("renders the form with initial values", async () => {
        const screen = renderComponent(UserEditForm, props);

        // Check that the name input has the user's name
        await expect.element(screen.getByLabelText(/Name */)).toHaveValue(props.user.name);

        // Check that the username input has the user's username
        await expect.element(screen.getByLabelText("Username *")).toHaveValue(props.user.username);

        // Password field should be empty
        await expect.element(screen.getByLabelText("User password *")).toHaveValue("");

        // Role select should be present for editable roles
        if ([Role.MANAGER, Role.STAFF, Role.HOSTESS].includes(props.user.role)) {
            await expect.element(screen.getByLabelText("Role")).toBeInTheDocument();
        }

        // Properties checkboxes should be rendered
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        expect(propertyCheckboxes.elements().length).toBe(props.properties.length);

        // Check that selected properties are checked
        for (const checkbox of propertyCheckboxes.elements()) {
            const label = checkbox.getAttribute("aria-label");
            const isChecked = props.selectedProperties.some(function (property) {
                return property.name === label;
            });
            await expect
                .element(checkbox)
                .toHaveAttribute("aria-checked", isChecked ? "true" : "false");
        }

        for (const [capability, defaultValue] of Object.entries(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
        )) {
            const checkbox = screen.getByRole("checkbox", { name: capability });
            await expect.element(checkbox).toBeVisible();
            await expect
                .element(checkbox)
                .toHaveAttribute("aria-checked", defaultValue ? "true" : "false");
        }
    });

    it("validates required fields", async () => {
        const screen = renderComponent(UserEditForm, props);

        // Clear the name field
        const nameInput = screen.getByLabelText(/Name */);
        await userEvent.clear(nameInput);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        // Expect validation error for name field
        await expect.element(screen.getByText("Please type something")).toBeVisible();
    });

    it("emits submit event with correct payload", async () => {
        const screen = renderComponent(UserEditForm, {
            ...props,
            user: {
                ...props.user,
            },
        });

        // Update fields
        await userEvent.clear(screen.getByLabelText(/Name */));
        await userEvent.type(screen.getByLabelText(/Name */), "Jane Doe");

        await userEvent.clear(screen.getByLabelText("Username *"));
        await userEvent.type(screen.getByLabelText("Username *"), "janedoe");

        await userEvent.type(screen.getByLabelText("User password *"), "newpassword123");

        // Change role to MANAGER
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Select additional property
        const propertyCheckbox = screen.getByRole("checkbox", { name: "Property 2" });
        await userEvent.click(propertyCheckbox);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        // Check emitted payload
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            name: "Jane Doe",
            username: "janedoe",
            password: "newpassword123",
            role: Role.MANAGER,
            email: "janedoe@TestOrg.org",
            relatedProperties: ["property1", "property2"],
        });
    });

    it("resets the form when reset button is clicked", async () => {
        const screen = renderComponent(UserEditForm, props);

        // Modify fields
        await userEvent.clear(screen.getByLabelText(/Name */));
        await userEvent.type(screen.getByLabelText(/Name */), "Jane Doe");

        await userEvent.type(screen.getByLabelText("User password *"), "newpassword123");

        // Deselect a property
        const propertyCheckbox = screen.getByRole("checkbox", { name: "Property 1" });
        await userEvent.click(propertyCheckbox);

        // Reset the form
        const resetButton = screen.getByRole("button", { name: "Reset" });
        await userEvent.click(resetButton);

        // Check that fields are reset
        await expect.element(screen.getByLabelText(/Name */)).toHaveValue(props.user.name);
        await expect.element(screen.getByLabelText("User password *")).toHaveValue("");

        // Check that properties are reset
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        for (const checkbox of propertyCheckboxes.elements()) {
            const label = checkbox.getAttribute("aria-label");
            const isChecked = props.selectedProperties.some(function (property) {
                return property.name === label;
            });
            await expect
                .element(checkbox)
                .toHaveAttribute("aria-checked", isChecked ? "true" : "false");
        }
    });

    it("does not show role and properties selection when role is not editable", async () => {
        props.user.role = Role.PROPERTY_OWNER;
        const screen = renderComponent(UserEditForm, props);

        // Role select should not be present
        await expect.element(screen.getByLabelText("Role")).not.toBeInTheDocument();

        // Properties selection should not be present
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        expect(propertyCheckboxes.elements().length).toBe(0);
    });

    it("shows capabilities checkboxes only for STAFF role", async () => {
        props.user.role = Role.STAFF;
        const screen = renderComponent(UserEditForm, props);
        await expect.element(screen.getByText("Capabilities:")).toBeVisible();

        screen.unmount();

        props.user.role = Role.MANAGER;
        screen.rerender(props);

        await expect.element(screen.getByText("Capabilities:")).not.toBeInTheDocument();
    });

    it("shows capabilities checkboxes when role changes from Manager to Staff", async () => {
        props.user.role = Role.MANAGER;
        const screen = renderComponent(UserEditForm, props);

        // Initially, capabilities should not be visible
        await expect.element(screen.getByText("Capabilities:")).not.toBeInTheDocument();

        // Change role to Staff
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const staffOption = screen.getByRole("option", { name: Role.STAFF });
        await userEvent.click(staffOption);

        // Capabilities should now be visible
        await expect.element(screen.getByText("Capabilities:")).toBeVisible();

        // Check that capabilities checkboxes are rendered
        for (const [capability, defaultValue] of Object.entries(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
        )) {
            const checkbox = screen.getByRole("checkbox", { name: capability });
            await expect.element(checkbox).toBeVisible();
            await expect
                .element(checkbox)
                .toHaveAttribute("aria-checked", defaultValue ? "true" : "false");
        }
    });

    it("preserves capabilities when changing role from Staff to Manager and back to Staff", async () => {
        props.user.role = Role.STAFF;
        props.user.capabilities = {
            ...props.user.capabilities,
            [UserCapability.CAN_RESERVE]: true,
            [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
            [UserCapability.CAN_DELETE_RESERVATION]: false,
        };
        const screen = renderComponent(UserEditForm, props);

        // Capabilities should be initially displayed with the user's capabilities
        await expect.element(screen.getByText("Capabilities:")).toBeVisible();
        let capabilityCheckbox = screen.getByRole("checkbox", { name: UserCapability.CAN_RESERVE });
        await expect.element(capabilityCheckbox).toBeChecked();
        capabilityCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_DELETE_RESERVATION,
        });
        await expect.element(capabilityCheckbox).not.toBeChecked();

        // Change role to Manager
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Capabilities should not be displayed
        await expect.element(screen.getByText("Capabilities:")).not.toBeInTheDocument();

        // Change role back to Staff
        await userEvent.click(roleSelect);
        const staffOption = screen.getByRole("option", { name: Role.STAFF });
        await userEvent.click(staffOption);

        // Capabilities should now be displayed again
        await expect.element(screen.getByText("Capabilities:")).toBeVisible();

        // Verify that the capabilities are preserved
        capabilityCheckbox = screen.getByRole("checkbox", { name: UserCapability.CAN_RESERVE });

        await expect.element(capabilityCheckbox).toBeChecked();
        capabilityCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_DELETE_RESERVATION,
        });

        await expect.element(capabilityCheckbox).not.toBeChecked();
    });

    it("emits default capabilities when role is updated to a new role", async () => {
        props.user.role = Role.STAFF;
        const screen = renderComponent(UserEditForm, props);

        // Change role to Manager
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            role: Role.MANAGER,
            capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.MANAGER],
        });
    });

    it("emits updated capabilities when capabilities are modified", async () => {
        // Start with default props (user role is STAFF)
        const screen = renderComponent(UserEditForm, props);

        // Modify capabilities
        const canReserveCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_RESERVE,
        });
        await userEvent.click(canReserveCheckbox);

        const canEditOwnReservationCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_EDIT_OWN_RESERVATION,
        });
        await userEvent.click(canEditOwnReservationCheckbox);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes the updated capabilities
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);

        // Create expected capabilities by toggling the modified ones
        const expectedCapabilities = {
            ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
            [UserCapability.CAN_RESERVE]:
                !DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_RESERVE],
            [UserCapability.CAN_EDIT_OWN_RESERVATION]:
                !DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_EDIT_OWN_RESERVATION],
        };

        expect(emittedPayload.capabilities).toMatchObject(expectedCapabilities);
    });

    it("updates the email in the emitted payload when the username is changed", async () => {
        const screen = renderComponent(UserEditForm, props);

        await userEvent.clear(screen.getByLabelText("Username *"));
        await userEvent.type(screen.getByLabelText("Username *"), "newusername");

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload.email).toBe("newusername@TestOrg.org");
    });

    it("updates the email suffix based on the organisation name in the emitted payload", async () => {
        props.organisation.name = "DifferentOrg";
        const screen = renderComponent(UserEditForm, props);

        await userEvent.clear(screen.getByLabelText("Username *"));
        await userEvent.type(screen.getByLabelText("Username *"), "newusername");

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload.email).toBe("newusername@DifferentOrg.org");
    });

    it("emits updated relatedProperties when properties selection is modified", async () => {
        const screen = renderComponent(UserEditForm, props);

        const property1Checkbox = screen.getByRole("checkbox", { name: "Property 1" });
        // Deselect Property 1
        await userEvent.click(property1Checkbox);

        const property2Checkbox = screen.getByRole("checkbox", { name: "Property 2" });
        // Select Property 2
        await userEvent.click(property2Checkbox);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes the updated relatedProperties
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload.relatedProperties).toEqual(["property2"]);
    });

    it("resets all fields to initial values after changing multiple fields and clicking reset", async () => {
        const screen = renderComponent(UserEditForm, props);

        // Modify multiple fields
        await userEvent.clear(screen.getByLabelText(/Name */));
        await userEvent.type(screen.getByLabelText(/Name */), "Jane Doe");

        await userEvent.type(screen.getByLabelText("User password *"), "newpassword123");

        // Change role to MANAGER
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Deselect a property
        const propertyCheckbox = screen.getByRole("checkbox", { name: "Property 1" });
        await userEvent.click(propertyCheckbox);

        // Reset the form
        const resetButton = screen.getByRole("button", { name: "Reset" });
        await userEvent.click(resetButton);

        // Check that fields are reset
        await expect.element(screen.getByLabelText(/Name */)).toHaveValue(props.user.name);
        await expect.element(screen.getByLabelText("User password *")).toHaveValue("");

        // Check that role is reset
        const roleSelectAfterReset = screen.getByLabelText("Role");
        // Need to simulate opening the select to check selected value
        await userEvent.click(roleSelectAfterReset);
        const selectedOption = screen.getByRole("option", { selected: true });
        await expect.element(selectedOption).toHaveTextContent(props.user.role);

        // Check that properties are reset
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        for (const checkbox of propertyCheckboxes.elements()) {
            const label = checkbox.getAttribute("aria-label");
            const isChecked = props.selectedProperties.some(function (property) {
                return property.name === label;
            });
            await expect
                .element(checkbox)
                .toHaveAttribute("aria-checked", isChecked ? "true" : "false");
        }
    });

    it("preserves capabilities for each role when switching between roles multiple times", async () => {
        props.user.role = Role.STAFF;
        props.user.capabilities = {
            ...props.user.capabilities,
            [UserCapability.CAN_RESERVE]: true,
            [UserCapability.CAN_SEE_GUEST_CONTACT]: false,
        };
        const screen = renderComponent(UserEditForm, props);

        // Change capabilities for Staff role
        const canReserveCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_RESERVE,
        });
        // Toggle to false
        await userEvent.click(canReserveCheckbox);

        // Change role to Manager
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Change role to Hostess
        await userEvent.click(roleSelect);
        const hostessOption = screen.getByRole("option", { name: Role.HOSTESS });
        await userEvent.click(hostessOption);

        // Change back to Staff
        await userEvent.click(roleSelect);
        const staffOption = screen.getByRole("option", { name: Role.STAFF });
        await userEvent.click(staffOption);

        // Verify that the capabilities are preserved for Staff role
        await expect.element(screen.getByText("Capabilities:")).toBeVisible();
        const canReserveCheckboxAfter = screen.getByRole("checkbox", {
            name: UserCapability.CAN_RESERVE,
        });

        // Should be false as toggled earlier
        await expect.element(canReserveCheckboxAfter).not.toBeChecked();

        const canSeeGuestContactCheckbox = screen.getByRole("checkbox", {
            name: UserCapability.CAN_SEE_GUEST_CONTACT,
        });
        await expect.element(canSeeGuestContactCheckbox).not.toBeChecked();
    });

    it("emits capabilities for non-staff roles when the role is changed", async () => {
        props.user.role = Role.STAFF;
        const screen = renderComponent(UserEditForm, props);

        // Change role to Hostess
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const hostessOption = screen.getByRole("option", { name: Role.HOSTESS });
        await userEvent.click(hostessOption);

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes capabilities for Hostess role
        expect(screen.emitted().submit).toBeTruthy();
        const [emittedPayload] = first(screen.emitted().submit as any[]);
        expect(emittedPayload).toMatchObject({
            role: Role.HOSTESS,
            capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.HOSTESS],
        });
    });
});
