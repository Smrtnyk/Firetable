import type firebase from "firebase";
import { Router } from "vue-router";
import { Store } from "vuex";

import { auth, functions } from "./base";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { Role, CreateUserPayload, ValueOf } from "src/types";
import { usersCollection } from "src/services/firebase/db";
import { useStore } from "src/store";

export function createUserWithEmail(payload: CreateUserPayload) {
    return functions().httpsCallable("createUser")(payload);
}

export function updateUser(
    uid: string,
    field: keyof CreateUserPayload,
    value: ValueOf<CreateUserPayload>
) {
    return usersCollection()
        .doc(uid)
        .update({
            [field]: value,
        });
}

export function isAuthenticated(store: ReturnType<typeof useStore>) {
    return store.state.auth.isAuthenticated;
}

export async function handleOnAuthStateChanged(
    router: Router,
    store: ReturnType<typeof useStore>,
    currentUser: firebase.User | null
) {
    const initialAuthState = isAuthenticated(store);
    // Save to the store
    store.commit("auth/setAuthState", {
        isAuthenticated: currentUser !== null,
    });

    if (currentUser) {
        await store.dispatch("auth/initUser", currentUser.uid);
    }

    /* If the user loses authentication route
       redirect them to the login page */
    if (!currentUser && initialAuthState) {
        await router.replace({ path: "/auth" });
    }
}

export function routerBeforeEach(
    router: Router,
    store: ReturnType<typeof useStore>
) {
    router.beforeEach(async (to) => {
        try {
            // Force the app to wait until Firebase has
            // finished its initialization, and handle the
            // authentication state of the user properly
            await ensureAuthIsInitialized(store);
            const requiresAuth = to.meta.requiresAuth;
            const requiresAdmin = to.meta.requiresAdmin;

            if (requiresAuth && !isAuthenticated(store)) {
                return { name: "auth" };
            }

            if (!isAuthenticated(store)) {
                return true;
            }

            const token = await auth()?.currentUser?.getIdTokenResult();
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

export function deleteUser(id: string) {
    const deleteFunction = functions().httpsCallable("deleteUser");
    return deleteFunction(id);
}

export function logoutUser() {
    return auth().signOut();
}

export function loginWithEmail(
    email: string,
    password: string
): Promise<firebase.auth.UserCredential> {
    return auth().signInWithEmailAndPassword(email, password);
}

/**
 * Async function providing the application time to
 * wait for firebase to initialize and determine if a
 * user is authenticated or not with only a single observable
 */
export function ensureAuthIsInitialized(store: ReturnType<typeof useStore>) {
    if (store.state.auth.isReady) {
        return true;
    }
    // Create the observer only once on init
    return new Promise<void>((resolve, reject) => {
        // Use a promise to make sure that the router will eventually show the route after the auth is initialized.
        const unsubscribe = auth().onAuthStateChanged(
            () => {
                resolve();
                unsubscribe();
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
