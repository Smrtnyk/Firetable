import { Router } from "vue-router";
import { Store } from "vuex";

import { auth, functions } from "./base";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { usersCollection } from "src/services/firebase/db";
import { useStore } from "src/store";
import { httpsCallable } from "@firebase/functions";
import { doc, updateDoc } from "@firebase/firestore";
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    User,
    UserCredential,
} from "@firebase/auth";
import { State } from "src/store/types";
import { CreateUserPayload, Role } from "src/types/auth";
import { ValueOf } from "src/types/generic";

export function createUserWithEmail(payload: CreateUserPayload) {
    return httpsCallable(functions(), "createUser")(payload);
}

export function updateUser(
    uid: string,
    field: keyof CreateUserPayload,
    value: ValueOf<CreateUserPayload>
) {
    return updateDoc(doc(usersCollection(), uid), {
        [field]: value,
    });
}

function isAuthenticated(store: ReturnType<typeof useStore>) {
    return store.state.auth.isAuthenticated;
}

export function handleOnAuthStateChanged(
    router: Router,
    { commit, dispatch }: Store<State>,
    currentUser: User | null
) {
    // Save to the store
    commit("auth/setAuthState", {
        isAuthenticated: currentUser !== null,
    });

    if (currentUser) {
        void dispatch("auth/initUser", currentUser.uid).catch(showErrorMessage);
        return;
    }

    // If the user loses authentication route
    // redirect them to the login page
    commit("auth/setUser", void 0);
    void router.replace({ path: "/auth" }).catch(showErrorMessage);
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
    const deleteFunction = httpsCallable(functions(), "deleteUser");
    return deleteFunction(id);
}

export function logoutUser() {
    return signOut(auth());
}

export function loginWithEmail(
    email: string,
    password: string
): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth(), email, password);
}

/**
 * Async function providing the application time to
 * wait for firebase to initialize and determine if a
 * user is authenticated or not with only a single observable
 */
function ensureAuthIsInitialized(store: ReturnType<typeof useStore>) {
    if (store.state.auth.isReady) {
        return true;
    }
    // Create the observer only once on init
    return new Promise<void>((resolve, reject) => {
        // Use a promise to make sure that the router will eventually show the route after the auth is initialized.
        const unsubscribe = onAuthStateChanged(
            auth(),
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
