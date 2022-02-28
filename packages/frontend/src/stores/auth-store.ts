import { defineStore } from "pinia";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { Collection, Role, User } from "@firetable/types";
import { NOOP, showErrorMessage } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";

interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | null;
    unsubscribeUserWatch: typeof NOOP;
}

export const useAuthStore = defineStore("auth", {
    state() {
        return {
            isAuthenticated: false,
            isReady: false,
            user: null,
            users: [],
            showCreateUserDialog: false,
            unsubscribeUserWatch: NOOP,
        } as AuthState;
    },
    getters: {
        isAdmin(): boolean {
            return !!this.user && this.user.role === Role.ADMIN;
        },

        isLoggedIn(): boolean {
            return !!this.user && !!this.user.email;
        },
    },
    actions: {
        setUser(user: User | null) {
            this.user = user;
        },

        setAuthState({
            isReady,
            isAuthenticated,
            unsubscribeUserWatch,
        }: Partial<Pick<AuthState, "isReady" | "isAuthenticated" | "unsubscribeUserWatch">>) {
            if (typeof isAuthenticated !== "undefined") {
                this.isAuthenticated = isAuthenticated;
            }
            if (typeof isReady !== "undefined") {
                this.isReady = isReady;
            }
            if (typeof unsubscribeUserWatch !== "undefined") {
                this.unsubscribeUserWatch = unsubscribeUserWatch;
            }
        },
        initUser(uid: string) {
            const { stopWatchingData } = useFirestoreDoc<User>({
                type: "watch",
                path: `${Collection.USERS}/${uid}`,
                inComponent: false,
                onReceive: (user) => {
                    if (!user) {
                        stopWatchingData();
                        showErrorMessage("User is not found in database!");
                        logoutUser().catch(NOOP);
                    } else {
                        this.user = user;
                        this.isAuthenticated = true;
                        this.isReady = true;
                        this.unsubscribeUserWatch = stopWatchingData;
                    }
                },
                onError(e) {
                    stopWatchingData();
                    showErrorMessage(e);
                    logoutUser().catch(NOOP);
                },
            });
        },
    },
});
