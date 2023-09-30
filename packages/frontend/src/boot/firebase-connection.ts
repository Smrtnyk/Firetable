import { boot } from "quasar/wrappers";
import { useAuthStore } from "src/stores/auth-store";
import { initializeFirebase } from "@firetable/backend";
import { Router } from "vue-router";
import { ADMIN } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { getCurrentUser, useCurrentUser, VueFire, VueFireAuth } from "vuefire";
import { watch } from "vue";

export default boot(({ router, app }) => {
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
function routerBeforeEach(router: Router, store: ReturnType<typeof useAuthStore>) {
    router.beforeEach(async (to) => {
        try {
            // Force the app to wait until Firebase has
            // finished its initialization, and handle the
            // authentication state of the user properly
            if (!store.isReady) {
                await getCurrentUser();
            }
            const requiresAuth = to.meta.requiresAuth;
            const requiresAdmin = to.meta.requiresAdmin;

            if (requiresAuth && !store.isAuthenticated) return { name: "auth" };
            if (!store.isAuthenticated) return true;

            const token = await (await getCurrentUser())?.getIdTokenResult();
            const role = token?.claims.role;
            const isAdmin = role === ADMIN;

            if (requiresAdmin && isAdmin) return true;
            if (requiresAdmin && !isAdmin) return { name: "home" };
            if (to.path === "/auth") return { name: "home" };
            return true;
        } catch (err) {
            showErrorMessage(err);
            return false;
        }
    });
}

function handleOnAuthStateChanged(router: Router, authStore: ReturnType<typeof useAuthStore>) {
    // Tell the application what to do when the
    // authentication state has changed */
    const currentUser = useCurrentUser();
    watch(
        () => currentUser.value,
        () => {
            // Save to the store
            authStore.setAuthState({
                isAuthenticated: !!currentUser.value,
            });
            if (!currentUser.value) {
                // If the user loses authentication route
                // redirect them to the login page
                authStore.setUser(null);
                router.replace({ path: "/auth" }).catch(showErrorMessage);
            } else {
                authStore.initUser(currentUser.value.uid);
            }
        },
    );
}
