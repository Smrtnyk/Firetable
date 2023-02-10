import { defineStore } from "pinia";
import { Collection, isSome, None, Option, Role, Some, User } from "@firetable/types";
import { NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";

interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: Option<User>;
    unsubscribeUserWatch: typeof NOOP;
}

export const useAuthStore = defineStore("auth", {
    state() {
        return {
            isAuthenticated: false,
            isReady: false,
            user: None(),
            users: [],
            showCreateUserDialog: false,
            unsubscribeUserWatch: NOOP,
        } as AuthState;
    },
    getters: {
        isAdmin(): boolean {
            return isSome(this.user) && this.user.unwrap().role === Role.ADMIN;
        },

        isLoggedIn(): boolean {
            return isSome(this.user) && !!this.user.unwrap().email;
        },
    },
    actions: {
        setUser(user: Option<User>) {
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
                this.user = Some(user.value);
                this.isAuthenticated = true;
                this.isReady = true;
                this.unsubscribeUserWatch = stop;
            }
        },
    },
});
