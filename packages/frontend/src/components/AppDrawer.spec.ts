import type { RenderResult } from "vitest-browser-vue";
import type { User } from "@firetable/types";
import AppDrawer from "./AppDrawer.vue";
import { getLocaleForTest, renderComponent } from "../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { Role } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { Dark } from "quasar";

describe("AppDrawer", () => {
    let user: User;
    let modelValue: boolean;
    let screen: RenderResult<any>;

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

    it("displays user avatar, name, and email", () => {
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

        expect(screen.getByText(user.name)).toBeTruthy();
        expect(screen.getByText(user.email)).toBeTruthy();

        const avatarText = user.name
            .split(" ")
            .map((n) => n[0])
            .join("");
        expect(screen.getByText(avatarText)).toBeTruthy();
    });

    it("displays correct links for MANAGER role", () => {
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

        const expectedLinks = [
            "Manage Events",
            "Manage Users",
            "Manage Floors",
            "Manage Analytics",
            "Settings",
        ];

        const allLinks = document.querySelectorAll(".q-item__section--main");
        const visibleLinks = Array.from(allLinks).map((link) => link.textContent);

        expect(visibleLinks).toEqual(expect.arrayContaining(expectedLinks));
    });

    it("renders logout button", () => {
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

        const logoutButton = screen.getByText("Logout").elements()[1];
        expect(logoutButton).toBeTruthy();
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
        const darkModeToggle = screen.getByText("Toggle dark mode");
        expect(darkModeToggle).toBeTruthy();

        await userEvent.click(darkModeToggle);

        expect(Dark.isActive).toBe(true);
        expect(localStorage.getItem("FTDarkMode")).not.toBe(initialDarkModeInStorage);
    });

    // TODO: figure out how to simulate click on overlay to close the drawer
    it.skip('emits "update:modelValue" when the drawer visibility changes', async () => {
        screen = renderComponent(
            AppDrawer,
            {
                modelValue: true,
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

        const emitted = screen.emitted();
        await userEvent.click(document.querySelector("body"));

        expect(emitted["update:modelValue"]).toBeTruthy();
        expect(emitted["update:modelValue"][0]).toEqual([false]);
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
        const languageSelect = screen.getByLabelText("Language");
        expect(languageSelect.query()).toBeTruthy();

        await userEvent.click(languageSelect);

        const germanOption = screen.getByRole("option", { name: "German" });
        await userEvent.click(germanOption);

        expect(getLocaleForTest().value).toBe("de");
    });
});
