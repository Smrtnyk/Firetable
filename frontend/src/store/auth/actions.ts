import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestore } from "src/composables/useFirestore";
import { Collection, User } from "src/types";

export function initUser({ commit }: any, uid: string) {
    useFirestore<User>({
        type: "watch",
        queryType: "doc",
        path: `${Collection.USERS}/${uid}`,
        inComponent: false,
        onFinished(user) {
            if (!user) {
                commit("setAuthState", {
                    isAuthenticated: false,
                    isReady: true,
                });
            } else {
                commit("setUser", user);
                commit("setAuthState", {
                    isAuthenticated: true,
                    isReady: true,
                });
            }
        },
        onError(e) {
            showErrorMessage(e);
            commit("setUser", void 0);
            commit("setAuthState", {
                isAuthenticated: false,
                isReady: true,
            });
        },
    });
}
