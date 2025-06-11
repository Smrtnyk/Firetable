import type { useAuthStore } from "src/stores/auth-store";
import type { usePermissionsStore } from "src/stores/permissions-store";
import type { RouteLocationNormalized, RouteLocationRaw } from "vue-router";

import { isFunction } from "es-toolkit";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { refreshApp } from "src/helpers/utils";
import { AppLogger } from "src/logger/FTLogger";
import { getCurrentUser } from "vuefire";

export type AuthGuard = (to: RouteLocationNormalized) => Promise<boolean | RouteLocationRaw>;

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

        try {
            const token = await user.getIdTokenResult();
            const role = token?.claims.role as string;

            return isFunction(allowedRoles)
                ? Boolean(allowedRoles(permissionsStore))
                : (allowedRoles as string[]).includes(role);
        } catch (error) {
            AppLogger.error("[Auth Guard] Token error:", error);
            return false;
        }
    }

    return async function authGuard(
        to: RouteLocationNormalized,
    ): Promise<boolean | RouteLocationRaw> {
        Loading.show({
            delay: 200,
            message: "Loading...",
        });

        try {
            const { isReady, user } = await checkAndInitAuth();
            const requiresAuth = to.meta.requiresAuth;

            if (import.meta.env.DEV) {
                AppLogger.info("[Auth Guard]", {
                    allowedRoles: to.meta.allowedRoles,
                    isReady,
                    path: to.path,
                    requiresAuth,
                });
            }

            // Handle auth route specially
            if (to.path === "/auth") {
                return isReady ? { name: "home" } : true;
            }

            // Handle protected routes
            if (requiresAuth && !isReady) {
                return { name: "auth" };
            }

            // Skip permission checks for non-protected routes
            if (!requiresAuth) {
                return true;
            }

            // Check permissions for protected routes
            const hasPermissions = await checkRoutePermissions(to, user);
            return hasPermissions ? true : { name: "home" };
        } catch (error) {
            AppLogger.error("[Auth Guard] Navigation error:", error);
            showErrorMessage("Navigation failed. Please try again.", refreshApp);
            return false;
        } finally {
            Loading.hide();
        }
    };
}
