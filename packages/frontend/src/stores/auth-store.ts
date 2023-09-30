import { defineStore } from "pinia";
import { ADMIN, Collection, User, UserPropertyMapDoc } from "@firetable/types";
import { isDefined, NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { watch } from "vue";
import { where } from "firebase/firestore";

interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | null;
    userPropertyMap: UserPropertyMapDoc[];
    unsubscribeUserWatch: typeof NOOP;
}

export const useAuthStore = defineStore("auth", {
    state() {
        return {
            isAuthenticated: false,
            isReady: false,
            user: null,
            unsubscribeUserWatch: NOOP,
            userPropertyMap: [],
        } as AuthState;
    },
    getters: {
        isAdmin(): boolean {
            return isDefined(this.user) && this.user.role === ADMIN;
        },

        isLoggedIn(): boolean {
            return isDefined(this.user) && !!this.user.email;
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
        async initProperties() {
            const {
                promise,
                data: properties,
                stop,
                error,
            } = useFirestoreCollection<UserPropertyMapDoc>(
                createQuery(
                    getFirestoreCollection(Collection.USER_PROPERTY_MAP),
                    where("userId", "==", this.user?.id),
                ),
            );
            await promise.value;
            // Add watcher for user in case user doc changes
            watch(
                () => properties.value,
                (newUserPropertyMap) => {
                    if (newUserPropertyMap) {
                        this.userPropertyMap = newUserPropertyMap;
                    }
                },
                { deep: true },
            );

            if (error.value) {
                stop();
                showErrorMessage(error.value);
                logoutUser().catch(NOOP);
                return;
            }

            this.userPropertyMap = properties.value;
        },
        async initUser(uid: string) {
            const {
                promise,
                data: user,
                stop,
                error,
            } = useFirestoreDocument<User>(`${Collection.USERS}/${uid}`);
            await promise.value;

            // Add watcher for user in case user doc changes
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
                stop();
                showErrorMessage(error.value);
                logoutUser().catch(NOOP);
                return;
            }
            if (!user.value) {
                stop();
                showErrorMessage("User is not found in database!");
                logoutUser().catch(NOOP);
                return;
            }
            this.user = user.value;
            await this.initProperties();
            this.isAuthenticated = true;
            this.isReady = true;
            this.unsubscribeUserWatch = stop;
        },
    },
});
