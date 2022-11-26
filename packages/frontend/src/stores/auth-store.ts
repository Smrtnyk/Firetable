import { defineStore } from "pinia";
import { Collection, Role, User } from "@firetable/types";
import { NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";

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
        async initUser(uid: string) {
            const {
                promise,
                data: user,
                stop,
                error,
            } = useFirestoreDocument<User>(`${Collection.USERS}/${uid}`);
            await promise.value;
            if (error.value) {
                stop();
                showErrorMessage(error.value);
                logoutUser().catch(NOOP);
                return;
            }
            if (!user.value) {
                stop();
                showErrorMessage("User is not found in database!");
                logoutUser().catch(NOOP);
            } else {
                this.user = user.value;
                this.isAuthenticated = true;
                this.isReady = true;
                this.unsubscribeUserWatch = stop;
            }
        },
    },
});
