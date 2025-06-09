import type { App } from "vue";

import { initializeFirebase } from "src/db";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { refreshApp } from "src/helpers/utils";
import { AppLogger } from "src/logger/FTLogger";
import router from "src/router";
import { createAuthGuard } from "src/router/auth-guard";
import { AuthState, useAuthStore } from "src/stores/auth-store";
import { useGuestsStore } from "src/stores/guests-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { watch } from "vue";
import { useCurrentUser, VueFire, VueFireAuth } from "vuefire";

export function initFirebaseAndAuth(app: App): void {
    const { firebaseApp } = initializeFirebase();
    app.use(VueFire, {
        firebaseApp,
        modules: [VueFireAuth()],
    });

    const authStore = useAuthStore();
    const permissionsStore = usePermissionsStore();

    router.beforeEach(createAuthGuard(authStore, permissionsStore));

    router.onError(function (error) {
        AppLogger.error("Router error:", error);

        if (
            error.message.includes("Failed to fetch dynamically imported module") ||
            error.message.includes("Loading chunk") ||
            error.message.includes("ChunkLoadError")
        ) {
            showErrorMessage("Reloading page to fetch new version.");
            setTimeout(refreshApp, 1000);
        }
    });

    handleOnAuthStateChanged(authStore);
}

function handleOnAuthStateChanged(authStore: ReturnType<typeof useAuthStore>): void {
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
                authStore.setAuthState(
                    currentUser.value ? AuthState.READY : AuthState.UNAUTHENTICATED,
                );
                await authStore.initUser(currentUser.value);
            } else {
                authStore.setAuthState(AuthState.UNAUTHENTICATED);
                const currentRoute = router.currentRoute.value;
                const requiresAuth = currentRoute.meta.requiresAuth;

                if (requiresAuth) {
                    await router.replace({ path: "/auth" }).catch(showErrorMessage);
                }

                const propertiesStore = usePropertiesStore();
                const guestsStore = useGuestsStore();
                authStore.cleanup();
                guestsStore.cleanup();
                propertiesStore.cleanup();
            }
        },
    );
}
