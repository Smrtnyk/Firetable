import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestore } from "src/composables/useFirestore";
import { Collection, User } from "src/types";
import { logoutUser } from "src/services/firebase/auth";

export function initUser({ commit }: any, uid: string) {
    const { stopWatchingData } = useFirestore<User>({
        type: "watch",
        queryType: "doc",
        path: `${Collection.USERS}/${uid}`,
        inComponent: false,
        onFinished(user) {
            if (!user) {
                stopWatchingData();
                showErrorMessage("User is not found in database!");
                void logoutUser();
            } else {
                commit("setUser", user);
                commit("setAuthState", {
                    isAuthenticated: true,
                    isReady: true,
                    unsubscribeUserWatch: stopWatchingData,
                });
            }
        },
        onError(e) {
            stopWatchingData();
            showErrorMessage(e);
            void logoutUser();
        },
    });
}
