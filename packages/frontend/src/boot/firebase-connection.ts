import { boot } from "quasar/wrappers";
import { onAuthStateChanged, User } from "firebase/auth";
import { useAuthStore } from "src/stores/auth-store";
import { initializeFirebase } from "@firetable/backend";
import { Router } from "vue-router";
import { Role } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";

export default boot(({ router }) => {
    const { auth } = initializeFirebase();

    const authStore = useAuthStore();

    // Tell the application what to do when the
    // authentication state has changed */
    onAuthStateChanged(
        auth,
        handleOnAuthStateChanged.bind(null, router, authStore),
        showErrorMessage
    );

    // Setup the router to be intercepted on each route.
    // This allows the application to halt rendering until
    // Firebase is finished with its initialization process,
    // and handle the user accordingly
    routerBeforeEach(router, authStore);
});

function routerBeforeEach(router: Router, store: any /* ReturnType<typeof useAuthStore> */) {
    router.beforeEach(async (to) => {
        try {
            // Force the app to wait until Firebase has
            // finished its initialization, and handle the
            // authentication state of the user properly
            await ensureAuthIsInitialized(store);
            const requiresAuth = to.meta.requiresAuth;
            const requiresAdmin = to.meta.requiresAdmin;

            if (requiresAuth && !store.isAuthenticated) {
                return { name: "auth" };
            }

            if (!store.isAuthenticated) {
                return true;
            }

            const { auth } = initializeFirebase();

            const token = await auth.currentUser?.getIdTokenResult();
            const role = token?.claims.role;
            const isAdmin = role === Role.ADMIN;

            if (requiresAdmin && !isAdmin) {
                return { name: "home" };
            } else if (requiresAdmin && isAdmin) {
                return true;
            } else if (to.path === "/auth") {
                return { name: "home" };
            } else {
                return true;
            }
        } catch (err) {
            showErrorMessage(err);
            return false;
        }
    });
}

/**
 * Async function providing the application time to
 * wait for firebase to initialize and determine if a
 * user is authenticated or not with only a single observable
 */
function ensureAuthIsInitialized(store: any /* ReturnType<typeof useAuthStore> */) {
    if (store.isReady) {
        return true;
    }
    // Create the observer only once on init
    return new Promise<void>((resolve, reject) => {
        const { auth } = initializeFirebase();
        // Use a promise to make sure that the router will eventually show the route after the auth is initialized.
        const unsubscribe = onAuthStateChanged(
            auth,
            () => {
                unsubscribe();
                resolve();
            },
            () => {
                reject(
                    new Error(
                        "Looks like there is a problem with the firebase service. Please try again later"
                    )
                );
            }
        );
    });
}

export function handleOnAuthStateChanged(
    router: Router,
    authStore: any, // ReturnType<typeof useAuthStore>
    currentUser: User | null
) {
    // Save to the store
    authStore.setAuthState({
        isAuthenticated: currentUser !== null,
    });

    if (currentUser) {
        authStore.initUser(currentUser.uid);
        return;
    }

    // If the user loses authentication route
    // redirect them to the login page
    authStore.setUser(null);
    router.replace({ path: "/auth" }).catch(showErrorMessage);
}
