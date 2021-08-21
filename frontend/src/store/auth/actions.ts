import { usersCollection } from "src/services/firebase/db";
import {
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { getDoc, doc } from "@firebase/firestore";

export function initUser({ commit }: any, uid: string) {
    return tryCatchLoadingWrapper(
        async () => {
            const user = await getDoc(doc(usersCollection(), uid));

            if (!user.exists()) {
                commit("setAuthState", {
                    isAuthenticated: false,
                    isReady: true,
                });
                return;
            }

            commit("setUser", {
                id: user.id,
                ...user.data(),
            });
            commit("setAuthState", {
                isAuthenticated: true,
                isReady: true,
            });
        },
        void 0,
        () => {
            commit("setUser", void 0);
            commit("setAuthState", {
                isAuthenticated: false,
                isReady: true,
            });
        }
    );
}
