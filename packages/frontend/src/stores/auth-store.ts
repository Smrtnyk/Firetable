import type { User } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { ADMIN, Collection, DEFAULT_CAPABILITIES_BY_ROLE, UserCapability } from "@firetable/types";
import { isDefined, NOOP } from "@firetable/utils";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import {
    initAdminProperties,
    initNonAdminProperties,
    initOrganisations,
} from "src/stores/usePropertiesStore";
import { Loading } from "quasar";

export const useAuthStore = defineStore("auth", () => {
    const isAuthenticated = ref(false);
    const isReady = ref(false);
    const user = ref<User | null>(null);
    const unsubscribers: (typeof NOOP)[] = [];
    const initInProgress = ref(false);

    const isAdmin = computed(() => {
        return user.value?.role === ADMIN;
    });

    const capabilities = computed(() => {
        return user.value?.capabilities ?? DEFAULT_CAPABILITIES_BY_ROLE[user.value!.role];
    });

    const isLoggedIn = computed(() => {
        return user.value?.email;
    });

    const canReserve = computed(() => {
        return !!capabilities.value[UserCapability.CAN_RESERVE];
    });

    const canSeeGuestContact = computed(() => {
        return !!capabilities.value[UserCapability.CAN_SEE_GUEST_CONTACT];
    });

    const canDeleteReservation = computed(() => {
        return !!capabilities.value[UserCapability.CAN_DELETE_RESERVATION];
    });

    const canDeleteOwnReservation = computed(() => {
        return !!capabilities.value[UserCapability.CAN_DELETE_OWN_RESERVATION];
    });

    const canConfirmReservation = computed(() => {
        return !!capabilities.value[UserCapability.CAN_CONFIRM_RESERVATION];
    });

    function cleanup(): void {
        unsubscribers.forEach((unsub) => {
            unsub();
        });
        isAuthenticated.value = false;
        isReady.value = false;
        initInProgress.value = false;
        user.value = null;
    }

    function setAuthState(isAuthenticatedVal: boolean): void {
        if (isDefined(isAuthenticated)) {
            isAuthenticated.value = isAuthenticatedVal;
        } else {
            isReady.value = false;
            initInProgress.value = false;
        }
    }

    async function initUser(authUser: FBUser): Promise<void> {
        if (initInProgress.value) {
            return;
        }
        initInProgress.value = true;
        try {
            Loading.show();
            const token = await authUser?.getIdTokenResult();
            const role = token?.claims.role as string;
            const organisationId = token?.claims.organisationId as string;

            if (role === ADMIN) {
                assignAdmin(authUser);
                await initOrganisations();
                await initAdminProperties();
            } else {
                await Promise.all([
                    watchAndAssignUser(authUser, organisationId),
                    initNonAdminProperties({
                        id: authUser.uid,
                        organisationId,
                    }),
                ]);
            }
        } finally {
            Loading.hide();
        }
    }

    function assignAdmin(authUser: FBUser): void {
        user.value = {
            name: "Admin",
            username: "admin",
            id: authUser.uid,
            role: ADMIN,
            email: authUser.email!,
            relatedProperties: [],
            organisationId: "",
        };
        isAuthenticated.value = true;
        isReady.value = true;
    }

    async function watchAndAssignUser(authUser: FBUser, organisationId: string): Promise<void> {
        const {
            promise,
            data: userRef,
            stop,
            error,
        } = useFirestoreDocument<User>(
            `${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}/${authUser.uid}`,
        );
        await promise.value;

        watch(
            () => userRef.value,
            (newUser) => {
                if (newUser) {
                    user.value = newUser;
                }
            },
            { deep: true },
        );

        if (error.value) {
            handleError(stop, error.value);
            return;
        }

        if (!userRef.value) {
            handleError(stop, { message: "User is not found in database!" });
            return;
        }

        user.value = userRef.value;
        isAuthenticated.value = true;
        isReady.value = true;
        unsubscribers.push(stop);
    }

    function handleError(stop: () => void, errorObj: { message: string }): void {
        stop();
        showErrorMessage(errorObj.message);
        logoutUser().catch(NOOP);
    }

    return {
        cleanup,
        setAuthState,
        initUser,
        isLoggedIn,
        isAdmin,
        canConfirmReservation,
        canDeleteOwnReservation,
        canReserve,
        canSeeGuestContact,
        canDeleteReservation,
        user,
        isAuthenticated,
        isReady,
    };
});
