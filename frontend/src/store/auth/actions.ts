import { firestoreAction } from "vuexfire";
import { usersCollection } from "src/services/firebase/db";
import {
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";

export const initUser = firestoreAction(({ bindFirestoreRef, commit }, uid) => {
    return tryCatchLoadingWrapper(
        async () => {
            const user = await bindFirestoreRef(
                "user",
                usersCollection().doc(uid)
            );

            if (!user) {
                commit("setAuthState", {
                    isAuthenticated: false,
                    isReady: true,
                });
                return;
            }

            commit("setAuthState", {
                isAuthenticated: true,
                isReady: true,
            });
        },
        void 0,
        () => {
            commit("setAuthState", {
                isAuthenticated: false,
                isReady: true,
            });
        }
    );
});
