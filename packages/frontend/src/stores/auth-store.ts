import { defineStore } from "pinia";
import { ADMIN, Collection, User } from "@firetable/types";
import { isDefined, NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { watch } from "vue";

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
            unsubscribeUserWatch: NOOP,
        } as AuthState;
    },
    getters: {
        isAdmin(): boolean {
            return this.user?.role === ADMIN;
        },

        isLoggedIn(): boolean {
            return !!this.user?.email;
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
            if (isDefined(isAuthenticated)) {
                this.isAuthenticated = isAuthenticated;
            }
            if (isDefined(isReady)) {
                this.isReady = isReady;
            }
            if (isDefined(unsubscribeUserWatch)) {
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

            // Watcher for user data
            watch(
                () => user.value,
                (newUser) => {
                    if (newUser) {
                        this.user = newUser;
                    }
                },
                { deep: true },
            );

            if (error.value) {
                this.handleError(stop, error.value);
                return;
            }

            if (!user.value) {
                this.handleError(stop, {
                    message: "User is not found in database!",
                });
                return;
            }

            this.user = user.value;
            this.isAuthenticated = true;
            this.isReady = true;
            this.unsubscribeUserWatch = stop;
        },

        handleError(stop: () => void, errorObj: { message: string }) {
            stop();
            showErrorMessage(errorObj.message);
            logoutUser().catch(NOOP);
        },
    },
});
