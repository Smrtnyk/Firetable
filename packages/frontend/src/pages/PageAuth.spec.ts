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
            tryCatchLoadingWrapperSpy: vi.fn(),
        };
    });

vi.mock("@firetable/backend", () => ({
    loginWithEmail: loginWithEmailSpy,
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        replace: routerReplaceSpy,
    }),
}));

vi.mock("src/helpers/ui-helpers", () => {
    return {
        tryCatchLoadingWrapper: tryCatchLoadingWrapperSpy.mockImplementation(
            async ({ hook, onError }) => {
                try {
                    await hook();
                } catch (error) {
                    console.log("in error", error);
                    if (onError) onError(error);
                }
            },
        ),
        showErrorMessage: showErrorMessageSpy,
    };
});

describe("PageAuth", () => {
    it("renders the form with initial values", () => {
        const screen = renderComponent(PageAuth);

        // Check that the username input is empty
        const usernameInput = screen.getByLabelText("Username *");
        expect(usernameInput.query()?.getAttribute("value")).toBe("");

        // Check that the password input is empty
        const passwordInput = screen.getByLabelText("Password *");
        expect(passwordInput.query()?.getAttribute("value")).toBe("");

        // Check that the password is of type 'password'
        expect(passwordInput.query()?.getAttribute("type")).toBe("password");
    });

    it("validates required fields", async () => {
        const screen = renderComponent(PageAuth);

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        // Check for validation errors
        const usernameError = screen.getByText("Please type something");
        expect(usernameError.query()).toBeTruthy();

        const passwordError = screen.getByText(
            "Please enter your password, it has to contain minimum 5 characters.",
        );
        expect(passwordError.query()).toBeTruthy();

        // Ensure that loginWithEmail was not called
        expect(loginWithEmailSpy).not.toHaveBeenCalled();
    });

    it("toggles password visibility", async () => {
        const screen = renderComponent(PageAuth);
        const passwordInput = screen.getByLabelText("Password *");
        // Initially, password type should be 'password'
        expect(passwordInput.query()?.getAttribute("type")).toBe("password");

        // Click the eye icon to toggle visibility
        const eyeIcon = screen.getByLabelText("Toggle password visibility");
        await userEvent.click(eyeIcon);

        // After clicking, password type should be 'text'
        expect(passwordInput.query()?.getAttribute("type")).toBe("text");

        // Click again to toggle back
        await userEvent.click(eyeIcon);

        // Password type should be 'password' again
        expect(passwordInput.query()?.getAttribute("type")).toBe("password");
    });

    // Cannot mock @firetable/backend for some reason
    it.skip("submits the form with valid inputs", async () => {
        const screen = renderComponent(PageAuth);

        await userEvent.type(screen.getByLabelText("Username *"), "testuser");
        await userEvent.type(screen.getByLabelText("Password *"), "password123");

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await nextTick();

        // Ensure that loginWithEmail was called with correct arguments
        expect(loginWithEmailSpy).toHaveBeenCalledWith("testuser", "password123");

        // Ensure that router.replace was called to navigate to "/"
        expect(routerReplaceSpy).toHaveBeenCalledWith("/");
    });

    // Cannot mock @firetable/backend for some reason
    it.skip("shows error when login fails", async () => {
        // Simulate loginWithEmail throwing an error
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

        // Ensure that loginWithEmail was called
        expect(loginWithEmailSpy).toHaveBeenCalledWith("testuser", "wrongpassword");

        // Ensure that router.replace was not called
        expect(routerReplaceSpy).not.toHaveBeenCalled();

        // Optionally, check that an error message is displayed
        // Assuming that your component displays an error message when login fails
        const errorMessage = screen.getByText("Invalid credentials");
        expect(errorMessage.query()).toBeTruthy();
    });

    it("validates password length", async () => {
        const screen = renderComponent(PageAuth);

        await userEvent.type(screen.getByLabelText("Username *"), "testuser");
        // Password too short
        await userEvent.type(screen.getByLabelText("Password *"), "1234");

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        // Check for validation error
        const passwordError = screen.getByText(
            "Please enter your password, it has to contain minimum 5 characters.",
        );
        expect(passwordError.query()).toBeTruthy();

        // Ensure that loginWithEmail was not called
        expect(loginWithEmailSpy).not.toHaveBeenCalled();
    });
});
