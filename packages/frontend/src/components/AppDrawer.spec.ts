import type { RenderResult } from "vitest-browser-vue";
import type { AppUser, PropertyDoc } from "@firetable/types";
import type { AppDrawerProps } from "./AppDrawer.vue";

import AppDrawer from "./AppDrawer.vue";

import { getLocaleForTest, renderComponent } from "../../test-helpers/render-component";
import { DEFAULT_CAPABILITIES_BY_ROLE, UserCapability, Role, AdminRole } from "@firetable/types";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { Dark } from "quasar";

describe("AppDrawer", () => {
    let user: AppUser;
    let modelValue: boolean;
    let screen: RenderResult<AppDrawerProps>;

    beforeEach(() => {
        user = {
            id: "user1",
            name: "John Doe",
            email: "john.doe@example.com",
            username: "johndoe",
            role: Role.MANAGER,
            relatedProperties: [],
            organisationId: "org1",
            capabilities: undefined,
        };
        modelValue = true;
    });

    afterEach(() => {
        screen.unmount();
        localStorage.clear();
    });

    function renderAppDrawer(
        userOverrides = {},
        capabilities = {},
        properties: PropertyDoc[] = [],
    ): void {
        const mergedUser = { ...user, ...userOverrides, capabilities };
        const piniaStoreOptions = {
            initialState: {
                auth: { user: mergedUser },
                properties: { properties },
            },
        };
        screen = renderComponent(
            AppDrawer,
            { modelValue },
            { wrapInLayout: true, piniaStoreOptions },
        );
    }

    function getVisibleLinks(): string[] {
        const allLinks = screen.container.querySelectorAll(".q-item__section--main");
        return Array.from(allLinks).map((link) => link.textContent!.trim());
    }

    function formatSnapshot(snapshot: string): string {
        return snapshot
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .join("\n");
    }

    describe("feature tests", () => {
        it("toggles dark mode when the toggle is clicked", async () => {
            renderAppDrawer();

            expect(Dark.isActive).toBe(false);

            const initialDarkModeInStorage = localStorage.getItem("FTDarkMode");
            await userEvent.click(screen.getByText("Toggle dark mode"));

            expect(Dark.isActive).toBe(true);
            expect(localStorage.getItem("FTDarkMode")).not.toBe(initialDarkModeInStorage);
        });

        it("displays user avatar, name, and email", async () => {
            renderAppDrawer();

            await expect.element(screen.getByText(user.name)).toBeVisible();
            await expect.element(screen.getByText(user.email)).toBeVisible();

            const avatarText = user.name
                .split(" ")
                .map((n) => n[0])
                .join("");
            await expect.element(screen.getByText(avatarText)).toBeVisible();
        });

        it("displays expandable Manage Inventory link when user has CAN_SEE_INVENTORY and multiple properties", async () => {
            user.capabilities = {
                [UserCapability.CAN_SEE_INVENTORY]: true,
            };
            renderAppDrawer({}, user.capabilities, [
                {
                    id: "property1",
                    name: "Property 1",
                    organisationId: user.organisationId,
                },
                {
                    id: "property2",
                    name: "Property 2",
                    organisationId: user.organisationId,
                },
            ]);

            const manageInventoryItem = screen.getByLabelText("Manage Inventory");
            await userEvent.click(screen.getByText("Manage Inventory"));

            await expect.element(manageInventoryItem.getByText("Property 1")).toBeVisible();
            await expect.element(manageInventoryItem.getByText("Property 2")).toBeVisible();
        });

        it("does not display property-dependent links when no properties are assigned", () => {
            renderAppDrawer({ role: Role.MANAGER }, { [UserCapability.CAN_SEE_INVENTORY]: true });

            const visibleLinks = getVisibleLinks();
            expect(visibleLinks).not.toContain("Manage Inventory");
        });

        it("changes language when a new language is selected", async () => {
            renderAppDrawer();

            expect(getLocaleForTest().value).toBe("en-GB");

            await userEvent.click(screen.getByLabelText("Language"));
            await userEvent.click(screen.getByRole("option", { name: "German" }));

            expect(getLocaleForTest().value).toBe("de");
        });
    });

    describe("AppDrawer Snapshot Testing", () => {
        const testCases = [
            {
                description: "Admin user (Admin view)",
                role: AdminRole.ADMIN,
                capabilities: {},
                expectedSnapshot: `
                - Manage Organisations
                - Issue Reports Overview
                - Logout
                `,
            },
            {
                description: "Property Owner",
                role: Role.PROPERTY_OWNER,
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.PROPERTY_OWNER],
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Manage Analytics
                - Manage Users
                - Guestbook
                - Manage Properties
                - Report an Issue
                - Settings
                - Logout
                `,
            },
            {
                description: "Manager",
                role: Role.MANAGER,
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.MANAGER],
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Manage Analytics
                - Manage Users
                - Guestbook
                - Report an Issue
                - Settings
                - Logout
                `,
            },
            {
                description: "Hostess",
                role: Role.HOSTESS,
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.HOSTESS],
                expectedSnapshot: `
                - Guestbook
                - Report an Issue
                - Logout
                `,
            },
        ];

        it.each(testCases)(
            `renders the correct menu for $description`,
            ({ role, expectedSnapshot, capabilities }) => {
                renderAppDrawer({ role }, capabilities, [
                    {
                        id: "property1",
                        name: "Property 1",
                        organisationId: user.organisationId,
                    } as PropertyDoc,
                ]);

                const visibleLinks = getVisibleLinks()
                    .map((link) => `- ${link}`)
                    .join("\n");
                expect(visibleLinks).toBe(formatSnapshot(expectedSnapshot));
            },
        );
    });

    describe("AppDrawer STAFF Role Testing", () => {
        const staffTestCases = [
            {
                description: "Staff with no special permissions",
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                expectedSnapshot: `
                - Report an Issue
                - Logout
                `,
            },
            {
                description: "Staff with inventory access",
                capabilities: {
                    ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                },
                expectedSnapshot: `
                - Manage Inventory
                - Report an Issue
                - Logout
                `,
            },
            {
                description: "Staff with inventory and floor plans access",
                capabilities: {
                    ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
                },
                expectedSnapshot: `
                - Manage Floors
                - Manage Inventory
                - Report an Issue
                - Logout
                `,
            },
            {
                description: "Staff with full permissions",
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                    [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
                    [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
                    [UserCapability.CAN_DELETE_RESERVATION]: true,
                    [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
                    [UserCapability.CAN_CONFIRM_RESERVATION]: true,
                    [UserCapability.CAN_CANCEL_RESERVATION]: true,
                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                    [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
                    [UserCapability.CAN_CREATE_EVENTS]: true,
                    [UserCapability.CAN_SEE_GUESTBOOK]: true,
                    [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: true,
                },
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Guestbook
                - Report an Issue
                - Logout
                `,
            },
        ];

        it.each(staffTestCases)(
            "renders the correct menu for $description",
            ({ capabilities, expectedSnapshot }) => {
                renderAppDrawer({ role: Role.STAFF }, capabilities, [
                    {
                        id: "property1",
                        name: "Property 1",
                        organisationId: user.organisationId,
                    } as PropertyDoc,
                ]);

                const visibleLinks = getVisibleLinks()
                    .map((link) => `- ${link}`)
                    .join("\n");
                expect(visibleLinks).toBe(formatSnapshot(expectedSnapshot));
            },
        );
    });
});
