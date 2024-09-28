import type { AdminUser, User, VoidFunction } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";
import {
    Role,
    ADMIN,
    Collection,
    DEFAULT_CAPABILITIES_BY_ROLE,
    UserCapability,
} from "@firetable/types";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { logoutUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { usePropertiesStore } from "src/stores/properties-store";
import { Loading } from "quasar";
import { isNotNil } from "es-toolkit/predicate";
import { noop } from "es-toolkit/function";

export const useAuthStore = defineStore("auth", function () {
    const isAuthenticated = ref(false);
    const isReady = ref(false);
    const user = ref<AdminUser | User | null>(null);
    const unsubscribers: (typeof noop)[] = [];
    const initInProgress = ref(false);

    const nonNullableUser = computed(function () {
        if (!user.value) {
            throw new Error("User is not defined!");
        }
        return user.value;
    });

    const isAdmin = computed(function () {
        return user.value?.role === ADMIN;
    });

    const isPropertyOwner = computed(function () {
        return user.value?.role === Role.PROPERTY_OWNER;
    });

    const capabilities = computed(function () {
        if (!user.value) {
            throw new Error("User is not defined!");
        }
        return user.value?.capabilities ?? DEFAULT_CAPABILITIES_BY_ROLE[user.value.role];
    });

    const isLoggedIn = computed(function () {
        return user.value?.email;
    });

    const canCreateEvents = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_CREATE_EVENTS]);
    });

    const canEditFloorPlans = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_EDIT_FLOOR_PLANS]);
    });

    const canSeeInventory = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_SEE_INVENTORY]);
    });

    const canReserve = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_RESERVE]);
    });

    const canSeeReservationCreator = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_SEE_RESERVATION_CREATOR]);
    });

    const canSeeGuestContact = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_SEE_GUEST_CONTACT]);
    });

    const canDeleteReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_DELETE_RESERVATION]);
    });

    const canDeleteOwnReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_DELETE_OWN_RESERVATION]);
    });

    const canConfirmReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_CONFIRM_RESERVATION]);
    });

    const canCancelReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_CANCEL_RESERVATION]);
    });

    const canEditReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_EDIT_RESERVATION]);
    });

    const canEditOwnReservation = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_EDIT_OWN_RESERVATION]);
    });

    function cleanup(): void {
        unsubscribers.forEach(function (unsub) {
            unsub();
        });
        isAuthenticated.value = false;
        isReady.value = false;
        initInProgress.value = false;
        user.value = null;
    }

    function setAuthState(isAuthenticatedVal: boolean): void {
        if (isNotNil(isAuthenticated)) {
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
            const role = token?.claims.role as (AdminUser | User)["role"];
            const organisationId = token?.claims.organisationId as string;
            const propertiesStore = usePropertiesStore();

            if (role === ADMIN) {
                assignAdmin(authUser);
                await propertiesStore.initOrganisations();
                await propertiesStore.initAdminProperties();
            } else {
                await Promise.all([
                    watchAndAssignUser(authUser, organisationId),
                    propertiesStore.initUserOrganisation(organisationId),
                    propertiesStore.initNonAdminProperties({
                        role,
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
        if (!authUser.email) {
            throw new Error("Admin user must have an email!");
        }

        user.value = {
            name: "Admin",
            username: "admin",
            id: authUser.uid,
            role: ADMIN,
            email: authUser.email,
            relatedProperties: [],
            organisationId: "",
            capabilities: undefined,
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
            function (newUser) {
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

    function handleError(stop: VoidFunction, errorObj: { message: string }): void {
        stop();
        showErrorMessage(errorObj.message);
        logoutUser().catch(noop);
    }

    return {
        cleanup,
        setAuthState,
        initUser,
        nonNullableUser,
        isLoggedIn,
        isAdmin,
        isPropertyOwner,
        canEditOwnReservation,
        canEditReservation,
        canSeeInventory,
        canCreateEvents,
        canEditFloorPlans,
        canSeeReservationCreator,
        canConfirmReservation,
        canCancelReservation,
        canDeleteOwnReservation,
        canReserve,
        canSeeGuestContact,
        canDeleteReservation,
        user,
        isAuthenticated,
        isReady,
    };
});
