import type { AppUser, User, VoidFunction } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";
import { getUserPath, logoutUser } from "../backend-proxy";
import { Role, AdminRole } from "@firetable/types";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { usePropertiesStore } from "src/stores/properties-store";
import { Loading } from "quasar";
import { noop } from "es-toolkit/function";
import { AppLogger } from "src/logger/FTLogger";

export const enum AuthState {
    UNAUTHENTICATED = "unauthenticated",
    INITIALIZING = "initializing",
    READY = "ready",
}

export const useAuthStore = defineStore("auth", function () {
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
            Loading.show();
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
                        role,
                        relatedProperties: userDocument.relatedProperties,
                        organisationId,
                    }),
                ]);
            }
            setAuthState(AuthState.READY);
        } catch (e) {
            handleError(noop, {
                message: e instanceof Error ? e.message : "Unknown error occurred",
            });
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
            role: AdminRole.ADMIN,
            email: authUser.email,
            relatedProperties: [],
            organisationId: "",
            capabilities: undefined,
        };
        setAuthState(AuthState.READY);
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
        cleanup,
        setAuthState,
        initUser,
        assignAdmin,
        unsubscribers,
        nonNullableUser,
        isLoggedIn,
        isAdmin,
        isPropertyOwner,
        user,
        isInitializing,
        isReady,
    };
});
