import { defineStore } from "pinia";
import { watch } from "vue";
import { ADMIN, Collection, User } from "@firetable/types";
import { isDefined, NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { User as FBUser } from "firebase/auth";

interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | null;
    unsubscribeUserWatch: typeof NOOP;
}

export const useAuthStore = defineStore("auth", {
    state(): AuthState {
        return {
            isAuthenticated: false,
            isReady: false,
            user: null,
            unsubscribeUserWatch: NOOP,
        };
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

        async initUser(authUser: FBUser) {
            const token = await authUser?.getIdTokenResult();
            const role = token?.claims.role as string;

            if (role === ADMIN) {
                this.assignAdmin(authUser);
            } else {
                await this.watchAndAssignUser(authUser, token?.claims.organisationId as string);
            }
        },

        assignAdmin(authUser: FBUser) {
            this.user = {
                name: "Admin",
                username: "admin",
                id: authUser.uid,
                role: ADMIN,
                email: authUser.email!,
                relatedProperties: [],
                organisationId: "",
            };
            this.isAuthenticated = true;
            this.isReady = true;
        },

        async watchAndAssignUser(authUser: FBUser, organisationId: string) {
            const {
                promise,
                data: user,
                stop,
                error,
            } = useFirestoreDocument<User>(
                `${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}/${authUser.uid}`,
            );
            await promise.value;

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
                this.handleError(stop, { message: "User is not found in database!" });
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
