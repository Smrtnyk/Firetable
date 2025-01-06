import type { RouteLocationNormalizedGeneric, RouteMeta } from "vue-router";
import type { AuthGuard } from "./auth-guard";
import type { usePermissionsStore } from "src/stores/permissions-store";
import { createAuthGuard } from "./auth-guard";
import { mockedStore } from "../../test-helpers/render-component";
import { useAuthStore, AuthState } from "src/stores/auth-store";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCurrentUser } from "vuefire";
import { Loading } from "quasar";
import { AppLogger } from "src/logger/FTLogger";
import { AdminRole, Role } from "@firetable/types";
import { createApp } from "vue";
import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { delay } from "es-toolkit";

vi.mock("vuefire", () => ({
    getCurrentUser: vi.fn(),
    useCollection: vi.fn(),
    useDocument: vi.fn(),
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    Loading: {
        show: vi.fn(),
        hide: vi.fn(),
    },
    Dialog: {
        create: vi.fn(() => ({
            onOk: vi.fn(),
        })),
    },
}));

vi.mock("src/logger/FTLogger", () => ({
    AppLogger: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

function createMockRoute(
    path: string,
    meta: Partial<RouteMeta> = {},
): RouteLocationNormalizedGeneric {
    return {
        path,
        meta,
        fullPath: path,
        hash: "",
        query: {},
        params: {},
        name: undefined,
        matched: [],
    } as unknown as RouteLocationNormalizedGeneric;
}

describe("Auth Guard", () => {
    let mockedAuthStore: ReturnType<typeof useAuthStore>;
    let mockPermissionsStore: ReturnType<typeof usePermissionsStore>;
    let guard: AuthGuard;

    beforeEach(() => {
        vi.useFakeTimers();
        const app = createApp({});
        const pinia = createTestingPinia({
            stubActions: false,
            createSpy: vi.fn,
        });
        app.use(pinia);
        setActivePinia(pinia);
        mockedAuthStore = mockedStore(useAuthStore) as any;
        mockPermissionsStore = {} as unknown as ReturnType<typeof usePermissionsStore>;
        guard = createAuthGuard(mockedAuthStore, mockPermissionsStore);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Authentication", () => {
        it("allows access to public routes when not authenticated", async () => {
            const to = createMockRoute("/public");

            mockedAuthStore.setAuthState(AuthState.UNAUTHENTICATED);

            expect(await guard(to)).toBe(true);
        });

        it("allows access to public routes when authenticated", async () => {
            const to = createMockRoute("/public");

            mockedAuthStore.setAuthState(AuthState.READY);

            expect(await guard(to)).toBe(true);
        });

        it("allows navigation to auth page when not authenticated", async () => {
            const to = createMockRoute("/auth");

            mockedAuthStore.setAuthState(AuthState.UNAUTHENTICATED);

            expect(await guard(to)).toBe(true);
        });

        it("redirects to home if authenticated and trying to access /auth", async () => {
            const to = createMockRoute("/auth");

            mockedAuthStore.setAuthState(AuthState.READY);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });

        it("redirects to auth for protected routes when not authenticated", async () => {
            const to = createMockRoute("/protected", { requiresAuth: true });

            mockedAuthStore.setAuthState(AuthState.UNAUTHENTICATED);

            expect(await guard(to)).toStrictEqual({ name: "auth" });
        });
    });

    describe("Authorization / Role Checks", () => {
        it("checks function-based role permissions", async () => {
            const mockRoleCheck = vi.fn().mockReturnValue(true);
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: mockRoleCheck,
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () =>
                    Promise.resolve({
                        claims: { role: AdminRole.ADMIN },
                    }),
            } as any);

            expect(await guard(to)).toStrictEqual(true);
            expect(mockRoleCheck).toHaveBeenCalledWith(mockPermissionsStore);
        });

        it("handles array-based role checks", async () => {
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN, Role.PROPERTY_OWNER],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve({ claims: { role: AdminRole.ADMIN } }),
            } as any);

            expect(await guard(to)).toBe(true);
        });

        it("redirects on role check failure", async () => {
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve({ claims: { role: Role.STAFF } }),
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });
    });

    describe("Initialization", () => {
        it("initializes auth when not ready", async () => {
            const to = createMockRoute("/protected", { requiresAuth: true });

            mockedAuthStore.setAuthState(AuthState.UNAUTHENTICATED);
            const mockUser = { uid: "test-uid" };
            vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as any);

            await guard(to);

            expect(mockedAuthStore.initUser).toHaveBeenCalledWith(mockUser);
        });

        it("skips initialization when ready", async () => {
            const to = createMockRoute("/protected", { requiresAuth: true });

            mockedAuthStore.setAuthState(AuthState.READY);

            await guard(to);

            expect(mockedAuthStore.initUser).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("handles auth initialization errors", async () => {
            const to = createMockRoute("/protected", { requiresAuth: true });

            mockedAuthStore.setAuthState(AuthState.UNAUTHENTICATED);
            const error = new Error("Auth initialization failed");
            vi.mocked(getCurrentUser).mockRejectedValueOnce(error);

            const res = await guard(to);

            expect(AppLogger.error).toHaveBeenCalledWith(
                "[Auth Guard] Error:",
                expect.objectContaining({
                    message: expect.stringContaining("Navigation failed"),
                }),
            );
            expect(res).toBe(false);
        });

        it("handles role check errors", async () => {
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Token fetch failed"));

            expect(await guard(to)).toBe(false);
            expect(AppLogger.error).toHaveBeenCalled();
        });

        it("identifies permission errors", async () => {
            const to = createMockRoute("/test", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () =>
                    Promise.resolve({
                        claims: { role: Role.STAFF },
                    }),
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });

        it("handles timeouts", async () => {
            const to = createMockRoute("/test");

            vi.mocked(getCurrentUser).mockImplementationOnce(() => delay(11_000) as any);

            const guardPromise = guard(to);
            vi.advanceTimersByTime(11_000);
            await guardPromise;

            expect(AppLogger.error).toHaveBeenCalledWith(
                "[Auth Guard] Error:",
                expect.objectContaining({
                    message: expect.stringContaining("timeout"),
                }),
            );
        });
    });

    describe("Navigation", () => {
        it("shows and hides loading state", async () => {
            const to = createMockRoute("/test");

            await guard(to);

            expect(Loading.show).toHaveBeenCalledWith({
                message: "Loading...",
                delay: 200,
            });
            expect(Loading.hide).toHaveBeenCalled();
        });

        it("handles successful navigation before timeout", async () => {
            const to = createMockRoute("/test");

            vi.mocked(getCurrentUser).mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        setTimeout(() => resolve(null), 1000);
                    }),
            );

            const guardPromise = guard(to);
            vi.advanceTimersByTime(1000);
            const res = await guardPromise;

            expect(AppLogger.error).not.toHaveBeenCalled();
            expect(res).toBe(true);
        });
    });

    describe("Concurrency", () => {
        it("handles multiple navigation attempts", async () => {
            const firstNav = guard(createMockRoute("/first"));
            const secondNav = guard(createMockRoute("/second"));

            vi.advanceTimersByTime(1000);

            const res = await Promise.all([firstNav, secondNav]);

            expect(res).toStrictEqual([true, true]);
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined token result", async () => {
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve(undefined) as any,
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });

        it("handles undefined role claims", async () => {
            const to = createMockRoute("/admin", {
                requiresAuth: true,
                allowedRoles: [AdminRole.ADMIN],
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve({ claims: {} }),
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });
    });
});
