import UserEditForm from "./UserEditForm.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { Role, DEFAULT_CAPABILITIES_BY_ROLE, UserCapability } from "@firetable/types";
import { describe, it, beforeEach, expect } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("UserEditForm", () => {
    let props;

    beforeEach(() => {
        props = {
            user: {
                id: "user1",
                name: "John Doe",
                email: "johndoe@TestOrg.at",
                username: "johndoe",
                role: Role.STAFF,
                relatedProperties: ["property1"],
                organisationId: "org1",
            },
            properties: [
                { id: "property1", name: "Property 1" },
                { id: "property2", name: "Property 2" },
            ],
            selectedProperties: [{ id: "property1", name: "Property 1" }],
            organisation: {
                id: "org1",
                name: "TestOrg",
            },
        };
    });

    it("renders the form with initial values", () => {
        const screen = renderComponent(UserEditForm, props);

        // Check that the name input has the user's name
        expect(
            screen
                .getByLabelText(/Name */)
                .query()
                .getAttribute("value"),
        ).toBe(props.user.name);

        // Check that the username input has the user's username
        expect(screen.getByLabelText("Username *").query().getAttribute("value")).toBe(
            props.user.username,
        );

        // Password field should be empty
        expect(screen.getByLabelText("User password *").query().getAttribute("value")).toBe("");

        // Role select should be present for editable roles
        if ([Role.MANAGER, Role.STAFF, Role.HOSTESS].includes(props.user.role)) {
            const roleSelect = screen.getByLabelText("Role");
            expect(roleSelect.query()).toBeTruthy();
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
            expect(checkbox.getAttribute("aria-checked")).toBe(isChecked ? "true" : "false");
        }

        for (const [capability, defaultValue] of Object.entries(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
        )) {
            const checkbox = screen.getByRole("checkbox", { name: capability });
            expect(checkbox.query()).toBeTruthy();
            expect(checkbox.query().getAttribute("aria-checked")).toBe(
                defaultValue ? "true" : "false",
            );
        }
    });

    it("validates required fields", async () => {
        const screen = renderComponent(UserEditForm, props);

        // Clear the name field
        const nameInput = screen.getByLabelText(/Name */).query();
        await userEvent.clear(nameInput);

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        // Expect validation error for name field
        expect(screen.getByText("Please type something").query()).toBeTruthy();
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

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        // Check emitted payload
        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
        expect(emittedPayload).toMatchObject({
            name: "Jane Doe",
            username: "janedoe",
            password: "newpassword123",
            role: Role.MANAGER,
            email: "janedoe@TestOrg.at",
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
        expect(
            screen
                .getByLabelText(/Name */)
                .query()
                .getAttribute("value"),
        ).toBe(props.user.name);
        expect(screen.getByLabelText("User password *").query().getAttribute("value")).toBe("");

        // Check that properties are reset
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        for (const checkbox of propertyCheckboxes.elements()) {
            const label = checkbox.getAttribute("aria-label");
            const isChecked = props.selectedProperties.some(function (property) {
                return property.name === label;
            });
            expect(checkbox.getAttribute("aria-checked")).toBe(isChecked ? "true" : "false");
        }
    });

    it("does not show role and properties selection when role is not editable", () => {
        props.user.role = Role.PROPERTY_OWNER;
        const screen = renderComponent(UserEditForm, props);

        // Role select should not be present
        expect(screen.getByLabelText("Role").query()).toBeNull();

        // Properties selection should not be present
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        expect(propertyCheckboxes.elements().length).toBe(0);
    });

    it("shows capabilities checkboxes only for STAFF role", () => {
        props.user.role = Role.STAFF;
        let screen = renderComponent(UserEditForm, props);
        expect(screen.getByText("Capabilities:").query()).toBeTruthy();

        screen.unmount();

        props.user.role = Role.MANAGER;
        screen = renderComponent(UserEditForm, props);

        expect(screen.getByText("Capabilities:").query()).toBeNull();
    });

    it("shows capabilities checkboxes when role changes from Manager to Staff", async () => {
        props.user.role = Role.MANAGER;
        const screen = renderComponent(UserEditForm, props);

        // Initially, capabilities should not be visible
        expect(screen.getByText("Capabilities:").query()).toBeNull();

        // Change role to Staff
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const staffOption = screen.getByRole("option", { name: Role.STAFF });
        await userEvent.click(staffOption);

        // Capabilities should now be visible
        expect(screen.getByText("Capabilities:").query()).toBeTruthy();

        // Check that capabilities checkboxes are rendered
        for (const [capability, defaultValue] of Object.entries(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
        )) {
            const checkbox = screen.getByRole("checkbox", { name: capability });
            expect(checkbox.query()).toBeTruthy();
            expect(checkbox.query().getAttribute("aria-checked")).toBe(
                defaultValue ? "true" : "false",
            );
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
        expect(screen.getByText("Capabilities:").query()).toBeTruthy();
        let capabilityCheckbox = screen
            .getByRole("checkbox", { name: UserCapability.CAN_RESERVE })
            .query();
        expect(capabilityCheckbox.getAttribute("aria-checked")).toBe("true");
        capabilityCheckbox = screen
            .getByRole("checkbox", {
                name: UserCapability.CAN_DELETE_RESERVATION,
            })
            .query();
        expect(capabilityCheckbox.getAttribute("aria-checked")).toBe("false");

        // Change role to Manager
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        // Capabilities should not be displayed
        expect(screen.getByText("Capabilities:").query()).toBeNull();

        // Change role back to Staff
        await userEvent.click(roleSelect);
        const staffOption = screen.getByRole("option", { name: Role.STAFF });
        await userEvent.click(staffOption);

        // Capabilities should now be displayed again
        expect(screen.getByText("Capabilities:").query()).toBeTruthy();

        // Verify that the capabilities are preserved
        capabilityCheckbox = screen
            .getByRole("checkbox", { name: UserCapability.CAN_RESERVE })
            .query();
        expect(capabilityCheckbox.getAttribute("aria-checked")).toBe("true");
        capabilityCheckbox = screen
            .getByRole("checkbox", {
                name: UserCapability.CAN_DELETE_RESERVATION,
            })
            .query();
        expect(capabilityCheckbox.getAttribute("aria-checked")).toBe("false");
    });

    it("emits default capabilities when role is updated to a new role", async () => {
        props.user.role = Role.STAFF;
        const screen = renderComponent(UserEditForm, props);

        // Change role to Manager
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const managerOption = screen.getByRole("option", { name: Role.MANAGER });
        await userEvent.click(managerOption);

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
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

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes the updated capabilities
        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];

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

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
        expect(emittedPayload.email).toBe("newusername@TestOrg.at");
    });

    it("updates the email suffix based on the organisation name in the emitted payload", async () => {
        props.organisation.name = "DifferentOrg";
        const screen = renderComponent(UserEditForm, props);

        await userEvent.clear(screen.getByLabelText("Username *"));
        await userEvent.type(screen.getByLabelText("Username *"), "newusername");

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
        expect(emittedPayload.email).toBe("newusername@DifferentOrg.at");
    });

    it("emits updated relatedProperties when properties selection is modified", async () => {
        const screen = renderComponent(UserEditForm, props);

        const property1Checkbox = screen.getByRole("checkbox", { name: "Property 1" });
        // Deselect Property 1
        await userEvent.click(property1Checkbox);

        const property2Checkbox = screen.getByRole("checkbox", { name: "Property 2" });
        // Select Property 2
        await userEvent.click(property2Checkbox);

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes the updated relatedProperties
        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
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
        expect(
            screen
                .getByLabelText(/Name */)
                .query()
                .getAttribute("value"),
        ).toBe(props.user.name);
        expect(screen.getByLabelText("User password *").query().getAttribute("value")).toBe("");

        // Check that role is reset
        const roleSelectAfterReset = screen.getByLabelText("Role");
        // Need to simulate opening the select to check selected value
        await userEvent.click(roleSelectAfterReset);
        const selectedOption = screen.getByRole("option", { selected: true });
        expect(selectedOption.query().textContent).toBe(props.user.role);

        // Check that properties are reset
        const propertyCheckboxes = screen.getByRole("checkbox", {
            name: /Property/,
        });
        for (const checkbox of propertyCheckboxes.elements()) {
            const label = checkbox.getAttribute("aria-label");
            const isChecked = props.selectedProperties.some(function (property) {
                return property.name === label;
            });
            expect(checkbox.getAttribute("aria-checked")).toBe(isChecked ? "true" : "false");
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
        expect(screen.getByText("Capabilities:").query()).toBeTruthy();
        const canReserveCheckboxAfter = screen
            .getByRole("checkbox", {
                name: UserCapability.CAN_RESERVE,
            })
            .query();
        // Should be false as toggled earlier
        expect(canReserveCheckboxAfter.getAttribute("aria-checked")).toBe("false");

        const canSeeGuestContactCheckbox = screen
            .getByRole("checkbox", {
                name: UserCapability.CAN_SEE_GUEST_CONTACT,
            })
            .query();
        expect(canSeeGuestContactCheckbox.getAttribute("aria-checked")).toBe("false");
    });

    it("emits capabilities for non-staff roles when the role is changed", async () => {
        props.user.role = Role.STAFF;
        const screen = renderComponent(UserEditForm, props);

        // Change role to Hostess
        const roleSelect = screen.getByLabelText("Role");
        await userEvent.click(roleSelect);
        const hostessOption = screen.getByRole("option", { name: Role.HOSTESS });
        await userEvent.click(hostessOption);

        const submitButton = screen.getByRole("button", { name: "Update" });
        await userEvent.click(submitButton);

        // Check that the emitted payload includes capabilities for Hostess role
        expect(screen.emitted().submit).toBeTruthy();
        const emittedPayload = screen.emitted().submit[0][0];
        expect(emittedPayload).toMatchObject({
            role: Role.HOSTESS,
            capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.HOSTESS],
        });
    });
});
