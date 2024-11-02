import type { Router } from "vue-router";
import { boot } from "quasar/wrappers";
import { useAuthStore } from "src/stores/auth-store";
import { initializeFirebase } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useCurrentUser, VueFire, VueFireAuth } from "vuefire";
import { watch } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { useGuestsStore } from "src/stores/guests-store";
import { createAuthGuard } from "src/router/auth-guard";
import { trackChunkFailures } from "src/app-event-handlers/unhandled-rejection";

export default boot(function ({ router, app }) {
    const { firebaseApp } = initializeFirebase();
    app.use(VueFire, {
        firebaseApp,
        modules: [VueFireAuth()],
    });

    const authStore = useAuthStore();

    trackChunkFailures();

    // Set up auth guard
    router.beforeEach(createAuthGuard(authStore));

    // Handle auth state changes
    handleOnAuthStateChanged(router, authStore);
});

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
                const guestsStore = useGuestsStore();
                authStore.cleanup();
                guestsStore.cleanup();
                propertiesStore.cleanup();
                // If the user loses authentication route
                // redirect them to the login page
                router.replace({ path: "/auth" }).catch(showErrorMessage);
            }
        },
    );
}
