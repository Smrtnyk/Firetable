import type { RenderResult } from "vitest-browser-vue";
import type { User } from "@firetable/types";
import type { AppDrawerProps } from "./AppDrawer.vue";
import AppDrawer from "./AppDrawer.vue";
import { getLocaleForTest, renderComponent } from "../../test-helpers/render-component";
import { UserCapability, Role } from "@firetable/types";
import { describe, it, expect, beforeEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { Dark } from "quasar";

describe("AppDrawer", () => {
    let user: User;
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
        // Drawer is visible
        modelValue = true;
    });

    it("displays user avatar, name, and email", async () => {
        screen = renderComponent(
            AppDrawer,
            {
                modelValue,
            },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        await expect.element(screen.getByText(user.name)).toBeVisible();
        await expect.element(screen.getByText(user.email)).toBeVisible();

        const avatarText = user.name
            .split(" ")
            .map((n) => n[0])
            .join("");
        await expect.element(screen.getByText(avatarText)).toBeVisible();
    });

    it("displays correct links for MANAGER role with no properties assigned", () => {
        user.role = Role.MANAGER;

        screen = renderComponent(
            AppDrawer,
            {
                modelValue,
            },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        const expectedLinks = ["Manage Users", "Guestbook", "Settings", "Logout"];

        const allLinks = document.querySelectorAll(".q-item__section--main");
        const visibleLinks = Array.from(allLinks).map((link) => link.textContent);

        expect(visibleLinks).toEqual(expect.arrayContaining(expectedLinks));
    });

    it("renders logout button", async () => {
        screen = renderComponent(
            AppDrawer,
            {
                modelValue,
            },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Logout")).toBeVisible();
    });

    it("toggles dark mode when the toggle is clicked", async () => {
        screen = renderComponent(
            AppDrawer,
            {
                modelValue,
            },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        expect(Dark.isActive).toBe(false);

        const initialDarkModeInStorage = localStorage.getItem("FTDarkMode");
        await userEvent.click(screen.getByText("Toggle dark mode"));

        expect(Dark.isActive).toBe(true);
        expect(localStorage.getItem("FTDarkMode")).not.toBe(initialDarkModeInStorage);
    });

    it("does not display inventory links when user lacks CAN_SEE_INVENTORY capability", async () => {
        user.capabilities = {
            [UserCapability.CAN_SEE_INVENTORY]: false,
        };

        screen = renderComponent(
            AppDrawer,
            { modelValue },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Manage Inventory")).not.toBeInTheDocument();
    });

    it("displays single Manage Inventory link when user has CAN_SEE_INVENTORY and one property", async () => {
        user.capabilities = {
            [UserCapability.CAN_SEE_INVENTORY]: true,
        };

        screen = renderComponent(
            AppDrawer,
            { modelValue },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                        properties: {
                            properties: [
                                {
                                    id: "property1",
                                    name: "Property 1",
                                    organisationId: user.organisationId,
                                },
                            ],
                        },
                    },
                },
            },
        );

        await expect.element(screen.getByText("Manage Inventory")).toBeVisible();

        // Ensure it's a single link, not an expandable item
        await expect.element(screen.getByText("Property 1")).not.toBeInTheDocument();
    });

    it("displays expandable Manage Inventory link when user has CAN_SEE_INVENTORY and multiple properties", async () => {
        user.capabilities = {
            [UserCapability.CAN_SEE_INVENTORY]: true,
        };

        screen = renderComponent(
            AppDrawer,
            { modelValue },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                        properties: {
                            properties: [
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
                            ],
                        },
                    },
                },
            },
        );

        const manageInventoryItem = screen.getByLabelText("Manage Inventory");
        // Simulate expanding the expandable item
        await userEvent.click(screen.getByText("Manage Inventory"));

        // Check that property links are displayed
        await expect.element(manageInventoryItem.getByText("Property 1")).toBeVisible();
        await expect.element(manageInventoryItem.getByText("Property 2")).toBeVisible();
    });

    it("uses custom capabilities over default capabilities", async () => {
        user.role = Role.MANAGER;
        user.capabilities = {
            [UserCapability.CAN_SEE_INVENTORY]: false,
        };

        screen = renderComponent(
            AppDrawer,
            { modelValue },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                        properties: {
                            properties: [
                                {
                                    id: "property1",
                                    name: "Property 1",
                                    organisationId: user.organisationId,
                                },
                            ],
                        },
                    },
                },
            },
        );

        // Even though MANAGER role has CAN_SEE_INVENTORY by default,
        // the custom capabilities should override it
        await expect.element(screen.getByText("Manage Inventory")).not.toBeInTheDocument();
    });

    it("changes language when a new language is selected", async () => {
        screen = renderComponent(
            AppDrawer,
            {
                modelValue,
            },
            {
                wrapInLayout: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: { user },
                    },
                },
            },
        );

        expect(getLocaleForTest().value).toBe("en-GB");

        await userEvent.click(screen.getByLabelText("Language"));
        await userEvent.click(screen.getByRole("option", { name: "German" }));

        expect(getLocaleForTest().value).toBe("de");
    });
});
