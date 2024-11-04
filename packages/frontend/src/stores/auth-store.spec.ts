import type { AppUser } from "@firetable/types";
import type { User as FBUser } from "firebase/auth";
import { useAuthStore } from "./auth-store";
import { usePropertiesStore } from "./properties-store";
import { mockedStore } from "../../test-helpers/render-component";
import { ADMIN, DEFAULT_CAPABILITIES_BY_ROLE, Role, UserCapability } from "@firetable/types";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, nextTick, ref } from "vue";

const { useFirestoreDocumentSpy, logoutUserSpy, showErrorMessageSpy, loadingSpy } = vi.hoisted(
    () => ({
        useFirestoreDocumentSpy: vi.fn(),
        logoutUserSpy: vi.fn().mockResolvedValue(undefined),
        showErrorMessageSpy: vi.fn(),
        loadingSpy: {
            show: vi.fn(),
            hide: vi.fn(),
        },
    }),
);

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreDocument: useFirestoreDocumentSpy,
    createQuery: vi.fn(),
    useFirestoreCollection: vi.fn(),
}));

vi.mock("../backend-proxy", () => ({
    getUserPath: (orgId: string, uid: string) => `organisations/${orgId}/users/${uid}`,
    logoutUser: logoutUserSpy,
}));

vi.mock("src/helpers/ui-helpers", () => ({
    showErrorMessage: showErrorMessageSpy,
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    Loading: loadingSpy,
}));

function createTestUser(options: Partial<AppUser> = {}): AppUser {
    return {
        id: "user1",
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        role: Role.STAFF,
        relatedProperties: [],
        organisationId: "org1",
        capabilities: undefined,
        ...options,
    };
}

function createTestFBUser(options: Partial<FBUser> = {}): FBUser {
    return {
        uid: "user1",
        email: "test@example.com",
        getIdTokenResult: vi.fn().mockResolvedValue({
            claims: {
                role: Role.STAFF,
                organisationId: "org1",
            },
        }),
        ...options,
    } as FBUser;
}

describe("auth-store.ts", () => {
    beforeEach(() => {
        const app = createApp({});
        const pinia = createPinia();
        app.use(pinia);
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    describe("initUser", () => {
        it("initializes admin user correctly", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const fbUser = createTestFBUser({
                getIdTokenResult: vi.fn().mockResolvedValue({
                    claims: {
                        role: ADMIN,
                        organisationId: "org1",
                    },
                }),
            });

            propertiesStore.initOrganisations = vi.fn();
            propertiesStore.initAdminProperties = vi.fn();

            await authStore.initUser(fbUser);

            expect(loadingSpy.show).toHaveBeenCalled();
            expect(authStore.isAdmin).toBe(true);
            expect(authStore.user).toEqual(
                expect.objectContaining({
                    role: ADMIN,
                    email: fbUser.email,
                }),
            );
            expect(propertiesStore.initOrganisations).toHaveBeenCalled();
            expect(propertiesStore.initAdminProperties).toHaveBeenCalled();
            expect(loadingSpy.hide).toHaveBeenCalled();
        });

        it("initializes non-admin user correctly", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const fbUser = createTestFBUser();
            const user = createTestUser();

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(user),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(null),
            });

            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();

            await authStore.initUser(fbUser);

            expect(loadingSpy.show).toHaveBeenCalled();
            expect(authStore.isAdmin).toBe(false);
            expect(authStore.user).toEqual(user);
            expect(propertiesStore.initUserOrganisation).toHaveBeenCalledWith("org1");
            expect(propertiesStore.initNonAdminProperties).toHaveBeenCalledWith({
                role: Role.STAFF,
                relatedProperties: user.relatedProperties,
                organisationId: "org1",
            });
            expect(loadingSpy.hide).toHaveBeenCalled();
        });

        it("handles errors during user initialization", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const error = new Error("Test error");

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(null),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(error),
            });

            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();

            // Create a non-admin user to trigger watchAndAssignUser
            const fbUser = createTestFBUser({
                getIdTokenResult: vi.fn().mockResolvedValue({
                    claims: {
                        role: Role.STAFF,
                        organisationId: "org1",
                    },
                }),
            });

            await authStore.initUser(fbUser);

            expect(loadingSpy.show).toHaveBeenCalled();
            expect(showErrorMessageSpy).toHaveBeenCalledWith(error.message);
            expect(logoutUserSpy).toHaveBeenCalled();
            expect(loadingSpy.hide).toHaveBeenCalled();

            expect(authStore.isAuthenticated).toBe(false);
            expect(authStore.isReady).toBe(false);
            expect(authStore.user).toBeUndefined();

            expect(authStore.initInProgress).toBe(false);
        });

        it("prevents multiple simultaneous initializations", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);

            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(createTestUser()),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(null),
            });

            const fbUser = createTestFBUser({
                getIdTokenResult: vi.fn().mockResolvedValue({
                    claims: {
                        role: Role.STAFF,
                        organisationId: "org1",
                    },
                }),
            });

            const firstInit = authStore.initUser(fbUser);
            const secondInit = authStore.initUser(fbUser);

            await Promise.all([firstInit, secondInit]);

            expect(loadingSpy.show).toHaveBeenCalledTimes(1);
            expect(authStore.isAuthenticated).toBe(true);
            expect(authStore.isReady).toBe(true);
            expect(authStore.initInProgress).toBe(false);
        });

        it("cleans up properly when initialization fails", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(null),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(null),
            });

            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();

            const fbUser = createTestFBUser({
                getIdTokenResult: vi.fn().mockRejectedValue(new Error("Token fetch failed")),
            });

            await authStore.initUser(fbUser);

            expect(authStore.isAuthenticated).toBe(false);
            expect(authStore.isReady).toBe(false);
            expect(authStore.initInProgress).toBe(false);
            expect(authStore.user).toBeUndefined();
            expect(loadingSpy.hide).toHaveBeenCalled();
        });
    });

    describe("setAuthState", () => {
        it("updates authentication state correctly", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.setAuthState(true);
            expect(authStore.isAuthenticated).toBe(true);

            authStore.setAuthState(false);
            expect(authStore.isAuthenticated).toBe(false);
        });

        it("resets ready state when authentication is invalid", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.isReady = true;
            authStore.initInProgress = true;

            authStore.setAuthState(undefined as any);

            expect(authStore.isReady).toBe(false);
            expect(authStore.initInProgress).toBe(false);
        });
    });

    describe("cleanup", () => {
        it("resets all state and calls unsubscribers", () => {
            const authStore = mockedStore(useAuthStore);
            const unsubSpy = vi.fn();

            authStore.user = createTestUser();
            authStore.isAuthenticated = true;
            authStore.isReady = true;
            authStore.initInProgress = true;

            authStore.unsubscribers.push(unsubSpy);

            authStore.cleanup();

            expect(authStore.user).toBeUndefined();
            expect(authStore.isAuthenticated).toBe(false);
            expect(authStore.isReady).toBe(false);
            expect(authStore.initInProgress).toBe(false);
            expect(unsubSpy).toHaveBeenCalled();
        });
    });

    describe("computed properties", () => {
        it("calculates isAdmin correctly", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.user = createTestUser({ role: ADMIN });
            expect(authStore.isAdmin).toBe(true);

            authStore.user = createTestUser({ role: Role.STAFF });
            expect(authStore.isAdmin).toBe(false);
        });

        it("calculates isPropertyOwner correctly", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.user = createTestUser({ role: Role.PROPERTY_OWNER });
            expect(authStore.isPropertyOwner).toBe(true);

            authStore.user = createTestUser({ role: Role.STAFF });
            expect(authStore.isPropertyOwner).toBe(false);
        });

        it("calculates isLoggedIn based on email presence", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.user = createTestUser({ email: "test@example.com" });
            expect(authStore.isLoggedIn).toBe(true);

            authStore.user = createTestUser({ email: "" });
            expect(authStore.isLoggedIn).toBe(false);

            authStore.user = undefined;
            expect(authStore.isLoggedIn).toBe(false);
        });

        it("calculates canSeeAnalytics for different roles", () => {
            const authStore = mockedStore(useAuthStore);

            // Should have access
            authStore.user = createTestUser({ role: ADMIN });
            expect(authStore.canSeeAnalytics).toBe(true);

            authStore.user = createTestUser({ role: Role.PROPERTY_OWNER });
            expect(authStore.canSeeAnalytics).toBe(true);

            authStore.user = createTestUser({ role: Role.MANAGER });
            expect(authStore.canSeeAnalytics).toBe(true);

            // Should not have access
            authStore.user = createTestUser({ role: Role.STAFF });
            expect(authStore.canSeeAnalytics).toBe(false);

            authStore.user = undefined;
            expect(authStore.canSeeAnalytics).toBe(false);
        });
    });

    describe("capability checks", () => {
        it("calculates capabilities correctly", () => {
            const authStore = mockedStore(useAuthStore);
            authStore.user = createTestUser({
                role: Role.STAFF,
                capabilities: {
                    [UserCapability.CAN_CREATE_EVENTS]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
                },
            });

            expect(authStore.canCreateEvents).toBe(true);
            expect(authStore.canEditFloorPlans).toBe(false);
        });

        it("prevents access to features when user is not defined", () => {
            const authStore = mockedStore(useAuthStore);
            authStore.user = undefined;

            // Any capability check should throw because capabilities computed prop has the guard
            expect(() => authStore.canCreateEvents).toThrow("User is not defined!");
        });

        it("correctly determines user capabilities based on role", () => {
            const authStore = mockedStore(useAuthStore);

            // Test staff user with default capabilities
            authStore.user = createTestUser({
                role: Role.STAFF,
                // force default capabilities
                capabilities: undefined,
            });

            expect(authStore.canCreateEvents).toBe(
                DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_CREATE_EVENTS],
            );
            expect(authStore.canEditFloorPlans).toBe(
                DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_EDIT_FLOOR_PLANS],
            );
        });

        it("respects custom user capabilities over role defaults", () => {
            const authStore = mockedStore(useAuthStore);

            // Test user with custom capabilities that override defaults
            authStore.user = createTestUser({
                role: Role.STAFF,
                capabilities: {
                    [UserCapability.CAN_CREATE_EVENTS]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
                },
            });

            expect(authStore.canCreateEvents).toBe(true);
            expect(authStore.canEditFloorPlans).toBe(false);
        });

        it("handles multiple capability checks for the same user", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.user = createTestUser({
                role: Role.STAFF,
                capabilities: {
                    [UserCapability.CAN_CREATE_EVENTS]: true,
                    [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
                    [UserCapability.CAN_SEE_INVENTORY]: true,
                    [UserCapability.CAN_RESERVE]: false,
                },
            });

            expect(authStore.canCreateEvents).toBe(true);
            expect(authStore.canEditFloorPlans).toBe(false);
            expect(authStore.canSeeInventory).toBe(true);
            expect(authStore.canReserve).toBe(false);
        });

        it("handles reservation-related capabilities", () => {
            const authStore = mockedStore(useAuthStore);

            authStore.user = createTestUser({
                role: Role.STAFF,
                capabilities: {
                    [UserCapability.CAN_EDIT_RESERVATION]: true,
                    [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
                    [UserCapability.CAN_DELETE_RESERVATION]: false,
                    [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
                    [UserCapability.CAN_CONFIRM_RESERVATION]: true,
                    [UserCapability.CAN_CANCEL_RESERVATION]: true,
                },
            });

            expect(authStore.canEditReservation).toBe(true);
            expect(authStore.canEditOwnReservation).toBe(true);
            expect(authStore.canDeleteReservation).toBe(false);
            expect(authStore.canDeleteOwnReservation).toBe(true);
            expect(authStore.canConfirmReservation).toBe(true);
            expect(authStore.canCancelReservation).toBe(true);
        });

        it("falls back to role defaults when user capabilities are undefined", () => {
            const authStore = mockedStore(useAuthStore);
            const role = Role.STAFF;

            authStore.user = createTestUser({
                role,
                capabilities: undefined,
            });

            // Check that each capability matches the default for the role
            // @ts-expect-error -- works spreading the enum although ts complains
            Object.values({ ...UserCapability }).forEach((capability) => {
                const defaultValue = DEFAULT_CAPABILITIES_BY_ROLE[role][capability];
                expect(authStore.capabilities[capability]).toBe(defaultValue);
            });
        });
    });

    describe("assignAdmin", () => {
        it("correctly assigns admin user", () => {
            const authStore = mockedStore(useAuthStore);
            const fbUser = createTestFBUser({
                email: "admin@example.com",
            });

            authStore.assignAdmin(fbUser);

            expect(authStore.user).toEqual({
                name: "Admin",
                username: "admin",
                id: fbUser.uid,
                role: ADMIN,
                email: fbUser.email,
                relatedProperties: [],
                organisationId: "",
                capabilities: undefined,
            });
            expect(authStore.isAuthenticated).toBe(true);
            expect(authStore.isReady).toBe(true);
        });

        it("throws error when admin user has no email", () => {
            const authStore = mockedStore(useAuthStore);
            // Intentionally passing in undefined
            const fbUser = createTestFBUser({ email: undefined! });

            expect(() => authStore.assignAdmin(fbUser)).toThrow("Admin user must have an email!");
        });
    });

    describe("watchAndAssignUser", () => {
        it("handles document updates after initial load", async () => {
            const authStore = mockedStore(useAuthStore);
            const initialUser = createTestUser();
            const updatedUser = { ...initialUser, name: "Updated Name" };
            const userRef = ref(initialUser);

            useFirestoreDocumentSpy.mockReturnValue({
                data: userRef,
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(null),
            });

            const fbUser = createTestFBUser({
                getIdTokenResult: vi.fn().mockResolvedValue({
                    claims: {
                        role: Role.STAFF,
                        organisationId: "org1",
                    },
                }),
            });

            const propertiesStore = mockedStore(usePropertiesStore);
            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();
            await authStore.initUser(fbUser);
            expect(authStore.user?.name).toBe(initialUser.name);
            userRef.value = updatedUser;

            await nextTick();

            expect(authStore.user?.name).toBe("Updated Name");
        });

        it("properly unsubscribes on cleanup", async () => {
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const stopSpy = vi.fn();

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(createTestUser()),
                promise: ref(Promise.resolve()),
                stop: stopSpy,
                error: ref(null),
            });

            propertiesStore.initUserOrganisation = vi.fn();
            propertiesStore.initNonAdminProperties = vi.fn();

            const fbUser = createTestFBUser();
            await authStore.initUser(fbUser);

            authStore.cleanup();
            expect(stopSpy).toHaveBeenCalled();
        });
    });

    describe("loading state management", () => {
        it("handles loading states correctly during successful initialization", async () => {
            const authStore = mockedStore(useAuthStore);
            const fbUser = createTestFBUser();

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(null),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
                error: ref(null),
            });

            const initPromise = authStore.initUser(fbUser);
            expect(loadingSpy.show).toHaveBeenCalled();
            expect(authStore.initInProgress).toBe(true);

            await initPromise;
            expect(loadingSpy.hide).toHaveBeenCalled();
            expect(authStore.initInProgress).toBe(false);
        });

        it("ensures loading is hidden even when errors occur", async () => {
            const authStore = mockedStore(useAuthStore);
            const fbUser = createTestFBUser();

            useFirestoreDocumentSpy.mockReturnValue({
                data: ref(null),
                promise: ref(Promise.reject(new Error("Test error"))),
                stop: vi.fn(),
                error: ref(new Error("Test error")),
            });

            await authStore.initUser(fbUser);
            expect(loadingSpy.hide).toHaveBeenCalled();
            expect(authStore.initInProgress).toBe(false);
        });
    });
});
