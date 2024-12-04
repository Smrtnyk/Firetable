import type { RouteLocationNormalized, RouteLocationRaw } from "vue-router";
import type { useAuthStore } from "src/stores/auth-store";
import type { usePermissionsStore } from "src/stores/permissions-store";
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
export function createAuthGuard(
    authStore: ReturnType<typeof useAuthStore>,
    permissionsStore: ReturnType<typeof usePermissionsStore>,
): AuthGuard {
    /**
     * Checks if user is authenticated and initializes if needed
     */
    async function checkAndInitAuth(): Promise<{
        isReady: boolean;
        user: Awaited<ReturnType<typeof getCurrentUser>>;
    }> {
        if (!authStore.isReady) {
            const currUser = await getCurrentUser();
            if (currUser) {
                await authStore.initUser(currUser);
                return { isReady: true, user: currUser };
            }
            return { isReady: false, user: null };
        }
        return { isReady: authStore.isReady, user: await getCurrentUser() };
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
            ? Boolean(allowedRoles(permissionsStore))
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
                    const { isReady, user } = await checkAndInitAuth();
                    const requiresAuth = to.meta.requiresAuth;

                    if (import.meta.env.DEV) {
                        AppLogger.info("[Auth Guard]", {
                            path: to.path,
                            isReady,
                            requiresAuth,
                            allowedRoles: to.meta.allowedRoles,
                        });
                    }

                    if (requiresAuth && !isReady) {
                        navigationResult = { name: "auth" };
                        return;
                    }

                    if (to.path === "/auth") {
                        navigationResult = isReady ? { name: "home" } : true;
                        return;
                    }

                    if (!isReady) {
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
                    showErrorMessage("Navigation timeout. Please try again.", refreshApp);
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
