import type { Router } from "vue-router";
import { boot } from "quasar/wrappers";
import { useAuthStore } from "src/stores/auth-store";
import { initializeFirebase } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { getCurrentUser, useCurrentUser, VueFire, VueFireAuth } from "vuefire";
import { watch } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { isFunction } from "es-toolkit";

export default boot(function ({ router, app }) {
    const { firebaseApp } = initializeFirebase();
    app.use(VueFire, {
        firebaseApp,
        modules: [VueFireAuth()],
    });

    const authStore = useAuthStore();
    handleOnAuthStateChanged(router, authStore);
    routerBeforeEach(router, authStore);
});

/**
 * Set up the router to be intercepted on each route.
 * This allows the application to halt rendering until
 * Firebase is finished with its initialization process,
 * and handle the user accordingly
 */
function routerBeforeEach(router: Router, authStore: ReturnType<typeof useAuthStore>): void {
    router.beforeEach(async function (to) {
        try {
            // Force the app to wait until Firebase has
            // finished its initialization, and handle the
            // authentication state of the user properly
            if (!authStore.isReady) {
                const currUser = await getCurrentUser();
                if (currUser) {
                    await authStore.initUser(currUser);
                }
            }
            const requiresAuth = to.meta.requiresAuth;

            if (requiresAuth && !authStore.isAuthenticated) {
                return { name: "auth" };
            }

            if (!authStore.isAuthenticated) {
                return true;
            }

            const token = await (await getCurrentUser())?.getIdTokenResult();
            const role = token?.claims.role as string;

            const allowedRoles = to.meta.allowedRoles;

            if (!allowedRoles) {
                return true;
            }

            const isAllowed = isFunction(allowedRoles)
                ? allowedRoles(authStore)
                : (allowedRoles as string[]).includes(role);
            if (isAllowed) {
                return true;
            }

            if (allowedRoles && !isAllowed) {
                return {
                    name: "home",
                };
            }

            if (to.path === "/auth") {
                return { name: "home" };
            }

            return true;
        } catch (err) {
            showErrorMessage(err);
            return false;
        }
    });
}

function handleOnAuthStateChanged(
    router: Router,
    authStore: ReturnType<typeof useAuthStore>,
): void {
    // Tell the application what to do when the
    // authentication state has changed
    let isFirstCall = true;
    const currentUser = useCurrentUser();
    watch(
        () => currentUser.value,
        async function () {
            if (currentUser.value) {
                if (isFirstCall) {
                    isFirstCall = false;
                    return;
                }
                authStore.setAuthState(Boolean(currentUser.value));
                await authStore.initUser(currentUser.value);
            } else {
                const propertiesStore = usePropertiesStore();
                // If the user loses authentication route
                // redirect them to the login page
                authStore.cleanup();
                propertiesStore.cleanup();
                router.replace({ path: "/auth" }).catch(showErrorMessage);
            }
        },
    );
}
