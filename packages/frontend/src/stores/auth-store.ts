import type { AppUser, User, VoidFunction } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";
import { getUserPath, logoutUser } from "../backend-proxy";
import { Role, ADMIN } from "@firetable/types";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { usePropertiesStore } from "src/stores/properties-store";
import { Loading } from "quasar";
import { isNotNil } from "es-toolkit/predicate";
import { noop } from "es-toolkit/function";
import { AppLogger } from "src/logger/FTLogger";

export const useAuthStore = defineStore("auth", function () {
    const isAuthenticated = ref(false);
    const isReady = ref(false);
    const user = ref<AppUser | undefined>();
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

    const isLoggedIn = computed(function () {
        return Boolean(user.value?.email);
    });

    function cleanup(): void {
        unsubscribers.forEach(function (unsub) {
            unsub();
        });
        isAuthenticated.value = false;
        isReady.value = false;
        initInProgress.value = false;
        user.value = undefined;
    }

    function setAuthState(isAuthenticatedVal: boolean): void {
        if (isNotNil(isAuthenticatedVal)) {
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
            const role = token?.claims.role as AppUser["role"];
            const organisationId = token?.claims.organisationId as string;
            const propertiesStore = usePropertiesStore();

            if (role === ADMIN) {
                assignAdmin(authUser);
                await propertiesStore.initOrganisations();
                await propertiesStore.initAdminProperties();
            } else {
                const userDocument = await watchAndAssignUser(authUser, organisationId);
                if (!userDocument) {
                    return;
                }
                await Promise.all([
                    propertiesStore.initUserOrganisation(organisationId),
                    propertiesStore.initNonAdminProperties({
                        role,
                        relatedProperties: userDocument.relatedProperties,
                        organisationId,
                    }),
                ]);
            }
        } catch (error) {
            handleError(noop, {
                message: error instanceof Error ? error.message : "Unknown error occurred",
            });
        } finally {
            initInProgress.value = false;
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

    async function watchAndAssignUser(
        authUser: FBUser,
        organisationId: string,
    ): Promise<User | undefined> {
        const {
            promise,
            data: userRef,
            stop,
            error,
        } = useFirestoreDocument<User>(getUserPath(organisationId, authUser.uid));
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

        return user.value;
    }

    function handleError(stop: VoidFunction, errorObj: { message: string }): void {
        stop();
        cleanup();
        showErrorMessage(errorObj.message);
        logoutUser().catch(AppLogger.error.bind(AppLogger));
    }

    return {
        cleanup,
        setAuthState,
        initUser,
        assignAdmin,
        unsubscribers,
        initInProgress,
        nonNullableUser,
        isLoggedIn,
        isAdmin,
        isPropertyOwner,
        user,
        isAuthenticated,
        isReady,
    };
});
