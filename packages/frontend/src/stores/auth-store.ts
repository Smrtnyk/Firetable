import type { AppUser, User, VoidFunction } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";

import { AdminRole, Role } from "@firetable/types";
import { noop } from "es-toolkit/function";
import { defineStore } from "pinia";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { getUserPath, logoutUser } from "src/db";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger";
import { useGlobalStore } from "src/stores/global-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref, watch } from "vue";

export const enum AuthState {
    INITIALIZING = "initializing",
    READY = "ready",
    UNAUTHENTICATED = "unauthenticated",
}

export const useAuthStore = defineStore("auth", function () {
    const globalStore = useGlobalStore();
    const state = ref<AuthState>(AuthState.UNAUTHENTICATED);
    const user = ref<AppUser | undefined>();
    const unsubscribers: VoidFunction[] = [];

    const isInitializing = computed(() => state.value === AuthState.INITIALIZING);
    const isReady = computed(() => state.value === AuthState.READY);

    const nonNullableUser = computed(function () {
        if (!user.value) {
            throw new Error("User is not defined!");
        }
        return user.value;
    });

    const isAdmin = computed(function () {
        return user.value?.role === AdminRole.ADMIN;
    });

    const isPropertyOwner = computed(function () {
        return user.value?.role === Role.PROPERTY_OWNER;
    });

    const isLoggedIn = computed(function () {
        return Boolean(user.value?.email);
    });

    function setAuthState(newState: AuthState): void {
        state.value = newState;
    }

    function cleanup(): void {
        unsubscribers.forEach(function (unsub) {
            unsub();
        });
        setAuthState(AuthState.UNAUTHENTICATED);
        user.value = undefined;
    }

    async function initUser(authUser: FBUser): Promise<void> {
        if (state.value === AuthState.INITIALIZING) {
            return;
        }

        setAuthState(AuthState.INITIALIZING);
        try {
            globalStore.setLoading(true);
            const token = await authUser?.getIdTokenResult();
            const role = token?.claims.role as AppUser["role"];
            const organisationId = token?.claims.organisationId as string;
            const propertiesStore = usePropertiesStore();

            if (role === AdminRole.ADMIN) {
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
                        organisationId,
                        relatedProperties: userDocument.relatedProperties,
                        role,
                    }),
                ]);
            }
            setAuthState(AuthState.READY);
        } catch (e) {
            handleError(noop, {
                message: e instanceof Error ? e.message : "Unknown error occurred",
            });
        } finally {
            globalStore.setLoading(false);
        }
    }

    function assignAdmin(authUser: FBUser): void {
        if (!authUser.email) {
            throw new Error("Admin user must have an email!");
        }

        user.value = {
            capabilities: undefined,
            email: authUser.email,
            id: authUser.uid,
            name: "Admin",
            organisationId: "",
            relatedProperties: [],
            role: AdminRole.ADMIN,
            username: "admin",
        };
        setAuthState(AuthState.READY);
    }

    async function watchAndAssignUser(
        authUser: FBUser,
        organisationId: string,
    ): Promise<undefined | User> {
        const {
            data: userRef,
            error,
            promise,
            stop,
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
        setAuthState(AuthState.READY);
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
        assignAdmin,
        cleanup,
        initUser,
        isAdmin,
        isInitializing,
        isLoggedIn,
        isPropertyOwner,
        isReady,
        nonNullableUser,
        setAuthState,
        unsubscribers,
        user,
    };
});
