import type { AppUser, PropertyDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { AdminRole, DEFAULT_CAPABILITIES_BY_ROLE, Role, UserCapability } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { useAppTheme } from "src/composables/useAppTheme";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AppDrawerProps } from "./AppDrawer.vue";

import { renderComponent } from "../../test-helpers/render-component";
import AppDrawer from "./AppDrawer.vue";

describe("AppDrawer", () => {
    let user: AppUser;
    let modelValue: boolean;
    let screen: RenderResult<AppDrawerProps>;

    beforeEach(() => {
        user = {
            capabilities: undefined,
            email: "john.doe@example.com",
            id: "user1",
            name: "John Doe",
            organisationId: "org1",
            relatedProperties: [],
            role: Role.MANAGER,
            username: "johndoe",
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
            { piniaStoreOptions, wrapInLayout: true },
        );
    }

    function getVisibleLinks(): string[] {
        const allLinks = screen.container.querySelectorAll(".v-list-item");
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
        it.todo("toggles dark mode when the toggle is clicked", async () => {
            renderAppDrawer();
            const { isDark } = useAppTheme();

            expect(isDark.value).toBe(false);

            const initialDarkModeInStorage = localStorage.getItem("FTDarkMode");
            await userEvent.click(screen.getByLabelText("Toggle dark mode"));

            expect(isDark.value).toBe(true);

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

        it.todo(
            "displays expandable Manage Inventory link when user has CAN_SEE_INVENTORY and multiple properties",
            async () => {
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

                const manageInventoryItem = screen.getByText("Manage Inventory");
                await userEvent.click(manageInventoryItem);

                await expect.element(manageInventoryItem.getByText("Property 1")).toBeVisible();
                await expect.element(manageInventoryItem.getByText("Property 2")).toBeVisible();
            },
        );

        it("does not display property-dependent links when no properties are assigned", () => {
            renderAppDrawer({ role: Role.MANAGER }, { [UserCapability.CAN_SEE_INVENTORY]: true });

            const visibleLinks = getVisibleLinks();
            expect(visibleLinks).not.toContain("Manage Inventory");
        });

        it("changes language when a new language is selected", async () => {
            renderAppDrawer();

            await userEvent.click(screen.getByText("English"));
            await userEvent.click(screen.getByRole("option", { name: "German" }));

            await expect.element(screen.getByText("Abmelden")).toBeVisible();
        });
    });

    describe("AppDrawer Snapshot Testing", () => {
        const testCases = [
            {
                capabilities: {},
                description: "Admin user (Admin view)",
                expectedSnapshot: `
                - Manage Organisations
                - Issue Reports Overview
                `,
                role: AdminRole.ADMIN,
            },
            {
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.PROPERTY_OWNER],
                description: "Property Owner",
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Manage Analytics
                - Settings
                - Manage Users
                - Guestbook
                - Manage Properties
                - Report an Issue
                `,
                role: Role.PROPERTY_OWNER,
            },
            {
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.MANAGER],
                description: "Manager",
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Manage Analytics
                - Settings
                - Manage Users
                - Guestbook
                - Report an Issue
                `,
                role: Role.MANAGER,
            },
            {
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.HOSTESS],
                description: "Hostess",
                expectedSnapshot: `
                - Guestbook
                - Report an Issue
                `,
                role: Role.HOSTESS,
            },
        ];

        it.each(testCases)(
            `renders the correct menu for $description`,
            ({ capabilities, expectedSnapshot, role }) => {
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
                capabilities: DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                description: "Staff with no special permissions",
                expectedSnapshot: `
                - Report an Issue
                `,
            },
            {
                capabilities: {
                    ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                },
                description: "Staff with inventory access",
                expectedSnapshot: `
                - Manage Inventory
                - Report an Issue
                `,
            },
            {
                capabilities: {
                    ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                },
                description: "Staff with inventory and floor plans access",
                expectedSnapshot: `
                - Manage Floors
                - Manage Inventory
                - Report an Issue
                `,
            },
            {
                capabilities: {
                    [UserCapability.CAN_CANCEL_RESERVATION]: true,
                    [UserCapability.CAN_CONFIRM_RESERVATION]: true,
                    [UserCapability.CAN_CREATE_EVENTS]: true,
                    [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
                    [UserCapability.CAN_DELETE_RESERVATION]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: true,
                    [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                    [UserCapability.CAN_RESERVE]: true,
                    [UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]: true,
                    [UserCapability.CAN_SEE_GUEST_CONTACT]: true,
                    [UserCapability.CAN_SEE_GUESTBOOK]: true,
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                    [UserCapability.CAN_SEE_RESERVATION_CREATOR]: true,
                },
                description: "Staff with full permissions",
                expectedSnapshot: `
                - Manage Events
                - Manage Floors
                - Manage Drink Cards
                - Manage Inventory
                - Guestbook
                - Report an Issue
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
