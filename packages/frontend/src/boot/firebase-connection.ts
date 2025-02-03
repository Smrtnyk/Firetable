import type { Router } from "vue-router";

import { initializeFirebase } from "@firetable/backend";
import { boot } from "quasar/wrappers";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { refreshApp } from "src/helpers/utils";
import { createAuthGuard } from "src/router/auth-guard";
import { AuthState, useAuthStore } from "src/stores/auth-store";
import { useGuestsStore } from "src/stores/guests-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { watch } from "vue";
import { useCurrentUser, VueFire, VueFireAuth } from "vuefire";

export default boot(function ({ app, router }) {
    const { firebaseApp } = initializeFirebase();
    app.use(VueFire, {
        firebaseApp,
        modules: [VueFireAuth()],
    });

    const authStore = useAuthStore();
    const permissionsStore = usePermissionsStore();

    router.beforeEach(createAuthGuard(authStore, permissionsStore));

    router.onError(function (error) {
        const isChunkLoadFailed =
            /loading chunk \d* failed./i.test(error.message) ||
            error.message.includes("dynamically imported module") ||
            error.message.includes("is not a valid JavaScript MIME type");
        if (isChunkLoadFailed && navigator.onLine) {
            showErrorMessage("New version is available, press ok to download.", refreshApp);
        }
    });

    handleOnAuthStateChanged(router, authStore);
});

function handleOnAuthStateChanged(
    router: Router,
    authStore: ReturnType<typeof useAuthStore>,
): void {
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
                const propertiesStore = usePropertiesStore();
                const guestsStore = useGuestsStore();
                authStore.cleanup();
                guestsStore.cleanup();
                propertiesStore.cleanup();

                const currentRoute = router.currentRoute.value;
                const requiresAuth = currentRoute.meta.requiresAuth;

                if (requiresAuth) {
                    router.replace({ path: "/auth" }).catch(showErrorMessage);
                }
            }
        },
    );
}
