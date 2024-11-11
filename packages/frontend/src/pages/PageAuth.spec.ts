import PageAuth from "./PageAuth.vue";
import { renderComponent } from "../../test-helpers/render-component";
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";

const { loginWithEmailSpy, routerReplaceSpy, showErrorMessageSpy, tryCatchLoadingWrapperSpy } =
    vi.hoisted(() => {
        return {
            loginWithEmailSpy: vi.fn(),
            routerReplaceSpy: vi.fn(),
            showErrorMessageSpy: vi.fn(),
            tryCatchLoadingWrapperSpy: vi.fn(async ({ hook, onError }) => {
                try {
                    await hook();
                } catch (error) {
                    console.log("in error", error);
                    if (onError) onError(error);
                }
            }),
        };
    });

vi.mock("../backend-proxy", () => ({
    loginWithEmail: loginWithEmailSpy,
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        replace: routerReplaceSpy,
    }),
}));

vi.mock("src/helpers/ui-helpers", () => {
    return {
        tryCatchLoadingWrapper: tryCatchLoadingWrapperSpy,
        showErrorMessage: showErrorMessageSpy,
    };
});

describe("PageAuth", () => {
    it("renders the form with initial values", async () => {
        const screen = renderComponent(PageAuth);

        await expect.element(screen.getByLabelText("Username *")).toHaveValue("");
        const passwordInput = screen.getByLabelText("Password *");
        await expect.element(passwordInput).toHaveValue("");
        await expect.element(passwordInput).toHaveAttribute("type", "password");
    });

    it("validates required fields", async () => {
        const screen = renderComponent(PageAuth);

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await expect.element(screen.getByText("Please type something")).toBeVisible();

        const passwordError = screen.getByText(
            "Please enter your password, it has to contain minimum 5 characters.",
        );
        await expect.element(passwordError).toBeVisible();

        expect(loginWithEmailSpy).not.toHaveBeenCalled();
    });

    it("toggles password visibility", async () => {
        const screen = renderComponent(PageAuth);
        const passwordInput = screen.getByLabelText("Password *");
        // Initially, password type should be 'password'
        await expect.element(passwordInput).toHaveAttribute("type", "password");

        const eyeIcon = screen.getByLabelText("Toggle password visibility");
        await userEvent.click(eyeIcon);

        // After clicking, password type should be 'text'
        await expect.element(passwordInput).toHaveAttribute("type", "text");

        // Click again to toggle back
        await userEvent.click(eyeIcon);

        // Password type should be 'password' again
        await expect.element(passwordInput).toHaveAttribute("type", "password");
    });

    it("submits the form with valid inputs", async () => {
        const screen = renderComponent(PageAuth);

        await userEvent.type(screen.getByLabelText("Username *"), "testuser");
        await userEvent.type(screen.getByLabelText("Password *"), "password123");

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await nextTick();

        expect(loginWithEmailSpy).toHaveBeenCalledWith("testuser", "password123");
        expect(routerReplaceSpy).toHaveBeenCalledWith("/");
    });

    it("shows error when login fails", async () => {
        loginWithEmailSpy.mockImplementation(() => {
            console.log("threw");
            throw new Error("Invalid credentials");
        });

        const screen = renderComponent(PageAuth);

        await userEvent.type(screen.getByLabelText("Username *"), "testuser");
        await userEvent.type(screen.getByLabelText("Password *"), "wrongpassword");

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await nextTick();

        expect(loginWithEmailSpy).toHaveBeenCalledWith("testuser", "wrongpassword");
        expect(routerReplaceSpy).not.toHaveBeenCalled();
        expect(showErrorMessageSpy).toHaveBeenCalledWith(
            "An unexpected error occurred. Please try again.",
        );
    });

    it("validates password length", async () => {
        const screen = renderComponent(PageAuth);

        await userEvent.type(screen.getByLabelText("Username *"), "testuser");
        // Password too short
        await userEvent.type(screen.getByLabelText("Password *"), "1234");

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        const passwordError = screen.getByText(
            "Please enter your password, it has to contain minimum 5 characters.",
        );
        await expect.element(passwordError).toBeVisible();
        expect(loginWithEmailSpy).not.toHaveBeenCalled();
    });
});
