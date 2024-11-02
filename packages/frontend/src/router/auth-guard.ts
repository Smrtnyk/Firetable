import type { RouteLocationNormalized, RouteLocationRaw } from "vue-router";
import type { useAuthStore } from "src/stores/auth-store";
import { getCurrentUser } from "vuefire";
import { isFunction } from "es-toolkit";
import { AppLogger } from "src/logger/FTLogger";
import { Loading } from "quasar";
import { refreshApp } from "src/helpers/utils";
import { showErrorMessage } from "src/helpers/ui-helpers";

type NavigationErrorType = "TIMEOUT" | "UNKNOWN";

interface NavigationError extends Error {
    type: NavigationErrorType;
    original?: unknown;
}

const NAVIGATION_TIMEOUT = 10_000;

function createNavigationError(error: unknown): NavigationError {
    const navigationError: NavigationError = {
        type: "UNKNOWN",
        message: "Navigation failed",
        name: "NavigationError",
    };

    if (error instanceof Error && error.message.includes("timeout")) {
        navigationError.type = "TIMEOUT";
        navigationError.message = "Navigation timeout";
    }

    navigationError.original = error;
    return navigationError;
}

export type AuthGuard = (to: RouteLocationNormalized) => Promise<RouteLocationRaw | boolean>;

/**
 * Set up the router to be intercepted on each route.
 * This allows the application to halt rendering until
 * Firebase is finished with its initialization process,
 * and handle the user accordingly
 */
export function createAuthGuard(authStore: ReturnType<typeof useAuthStore>): AuthGuard {
    /**
     * Checks if user is authenticated and initializes if needed
     */
    async function checkAndInitAuth(): Promise<{
        isAuthenticated: boolean;
        user: Awaited<ReturnType<typeof getCurrentUser>>;
    }> {
        if (!authStore.isReady) {
            const currUser = await getCurrentUser();
            if (currUser) {
                await authStore.initUser(currUser);
                return { isAuthenticated: true, user: currUser };
            }
            return { isAuthenticated: false, user: null };
        }
        return { isAuthenticated: authStore.isAuthenticated, user: await getCurrentUser() };
    }

    /**
     * Checks if user has required role for the route
     */
    async function checkRoutePermissions(
        to: RouteLocationNormalized,
        user: Awaited<ReturnType<typeof getCurrentUser>>,
    ): Promise<boolean> {
        const allowedRoles = to.meta.allowedRoles;
        if (!allowedRoles) {
            return true;
        }

        if (!user) {
            return false;
        }

        const token = await user.getIdTokenResult();
        const role = token?.claims.role as string;

        return isFunction(allowedRoles)
            ? Boolean(allowedRoles(authStore))
            : (allowedRoles as string[]).includes(role);
    }

    return async function authGuard(
        to: RouteLocationNormalized,
    ): Promise<RouteLocationRaw | boolean> {
        Loading.show({
            message: "Loading...",
            delay: 200,
        });

        try {
            const timeoutPromise = new Promise<never>((_resolve, reject) => {
                setTimeout(() => {
                    reject(new Error("Navigation timeout"));
                }, NAVIGATION_TIMEOUT);
            });

            let navigationResult: RouteLocationRaw | boolean = false;

            await Promise.race([
                (async () => {
                    const { isAuthenticated, user } = await checkAndInitAuth();
                    const requiresAuth = to.meta.requiresAuth;

                    if (import.meta.env.DEV) {
                        AppLogger.info("[Auth Guard]", {
                            path: to.path,
                            isAuthenticated,
                            requiresAuth,
                            allowedRoles: to.meta.allowedRoles,
                        });
                    }

                    if (requiresAuth && !isAuthenticated) {
                        navigationResult = { name: "auth" };
                        return;
                    }

                    if (to.path === "/auth") {
                        navigationResult = isAuthenticated ? { name: "home" } : true;
                        return;
                    }

                    if (!isAuthenticated) {
                        navigationResult = true;
                        return;
                    }

                    const hasPermissions = await checkRoutePermissions(to, user);
                    if (!hasPermissions) {
                        navigationResult = { name: "home" };
                        return;
                    }

                    navigationResult = true;
                })(),
                timeoutPromise,
            ]);

            return navigationResult;
        } catch (error) {
            const navigationError = createNavigationError(error);
            AppLogger.error("[Auth Guard] Error:", navigationError);

            switch (navigationError.type) {
                case "TIMEOUT":
                    showErrorMessage("Navigation timeout. Please try again.");
                    break;
                default:
                    showErrorMessage(navigationError.message, refreshApp);
                    break;
            }
            return false;
        } finally {
            Loading.hide();
        }
    };
}
