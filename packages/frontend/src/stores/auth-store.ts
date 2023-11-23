import { defineStore } from "pinia";
import { watch } from "vue";
import {
    ADMIN,
    Collection,
    DEFAULT_CAPABILITIES_BY_ROLE,
    User,
    UserCapabilities,
    UserCapability,
} from "@firetable/types";
import { isDefined, NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { User as FBUser } from "firebase/auth";
import {
    initAdminProperties,
    initNonAdminProperties,
    initOrganisations,
} from "src/stores/usePropertiesStore";
import { Loading } from "quasar";

interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | null;
    initInProgress: boolean;
    unsubscribers: (typeof NOOP)[];
}

export const useAuthStore = defineStore("auth", {
    state(): AuthState {
        return {
            isAuthenticated: false,
            isReady: false,
            user: null,
            unsubscribers: [],
            initInProgress: false,
        };
    },
    getters: {
        isAdmin(): boolean {
            return this.user?.role === ADMIN;
        },

        capabilities(): UserCapabilities {
            return this.user!.capabilities ?? DEFAULT_CAPABILITIES_BY_ROLE[this.user!.role];
        },

        isLoggedIn(): boolean {
            return !!this.user?.email;
        },

        canReserve(): boolean {
            return !!this.capabilities[UserCapability.CAN_RESERVE];
        },

        canSeeGuestContact(): boolean {
            return !!this.capabilities[UserCapability.CAN_SEE_GUEST_CONTACT];
        },

        canDeleteReservation(): boolean {
            return !!this.capabilities[UserCapability.CAN_DELETE_RESERVATION];
        },

        canDeleteOwnReservation(): boolean {
            return !!this.capabilities[UserCapability.CAN_DELETE_OWN_RESERVATION];
        },

        canConfirmReservation(): boolean {
            return !!this.capabilities[UserCapability.CAN_CONFIRM_RESERVATION];
        },
    },
    actions: {
        cleanup() {
            this.unsubscribers.forEach((unsub) => {
                unsub();
            });
            this.isAuthenticated = false;
            this.isReady = false;
            this.initInProgress = false;
            this.user = null;
        },

        setAuthState(isAuthenticated: boolean) {
            if (isDefined(isAuthenticated)) {
                this.isAuthenticated = isAuthenticated;
            } else {
                this.isReady = false;
                this.initInProgress = false;
            }
        },

        async initUser(authUser: FBUser) {
            if (this.initInProgress) {
                return;
            }
            this.initInProgress = true;
            try {
                Loading.show();
                const token = await authUser?.getIdTokenResult();
                const role = token?.claims.role as string;
                const organisationId = token?.claims.organisationId as string;

                if (role === ADMIN) {
                    this.assignAdmin(authUser);
                    await initOrganisations();
                    await initAdminProperties();
                } else {
                    await Promise.all([
                        this.watchAndAssignUser(authUser, organisationId),
                        initNonAdminProperties({
                            id: authUser.uid,
                            organisationId,
                        }),
                    ]);
                }
                this.isReady = true;
            } finally {
                Loading.hide();
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
            this.unsubscribers.push(stop);
        },

        handleError(stop: () => void, errorObj: { message: string }) {
            stop();
            showErrorMessage(errorObj.message);
            logoutUser().catch(NOOP);
        },
    },
});
