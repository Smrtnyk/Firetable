import type { usePermissionsStore } from "src/stores/permissions-store";
import type { RouteLocationNormalizedGeneric, RouteMeta } from "vue-router";

import { AdminRole, Role } from "@firetable/types";
import { createTestingPinia } from "@pinia/testing";
import { setActivePinia } from "pinia";
import { Loading } from "quasar";
import { AppLogger } from "src/logger/FTLogger";
import { AuthState, useAuthStore } from "src/stores/auth-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";
import { getCurrentUser } from "vuefire";

import type { AuthGuard } from "./auth-guard";

import { mockedStore } from "../../test-helpers/render-component";
import { createAuthGuard } from "./auth-guard";

vi.mock("vuefire", () => ({
    getCurrentUser: vi.fn(),
    useCollection: vi.fn(),
    useDocument: vi.fn(),
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    Dialog: {
        create: vi.fn(() => ({
            onOk: vi.fn(),
        })),
    },
    Loading: {
        hide: vi.fn(),
        show: vi.fn(),
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
        fullPath: path,
        hash: "",
        matched: [],
        meta,
        name: undefined,
        params: {},
        path,
        query: {},
    } as unknown as RouteLocationNormalizedGeneric;
}

describe("Auth Guard", () => {
    let mockedAuthStore: ReturnType<typeof useAuthStore>;
    let mockPermissionsStore: ReturnType<typeof usePermissionsStore>;
    let guard: AuthGuard;

    beforeEach(() => {
        const app = createApp({});
        const pinia = createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
        });
        app.use(pinia);
        setActivePinia(pinia);
        mockedAuthStore = mockedStore(useAuthStore) as any;
        mockPermissionsStore = {} as unknown as ReturnType<typeof usePermissionsStore>;
        guard = createAuthGuard(mockedAuthStore, mockPermissionsStore);
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
                allowedRoles: mockRoleCheck,
                requiresAuth: true,
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
                allowedRoles: [AdminRole.ADMIN, Role.PROPERTY_OWNER],
                requiresAuth: true,
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve({ claims: { role: AdminRole.ADMIN } }),
            } as any);

            expect(await guard(to)).toBe(true);
        });

        it("redirects on role check failure", async () => {
            const to = createMockRoute("/admin", {
                allowedRoles: [AdminRole.ADMIN],
                requiresAuth: true,
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

            expect(AppLogger.error).toHaveBeenCalledWith("[Auth Guard] Navigation error:", error);
            expect(res).toBe(false);
        });

        it("handles role check errors", async () => {
            const to = createMockRoute("/admin", {
                allowedRoles: [AdminRole.ADMIN],
                requiresAuth: true,
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Token fetch failed"));

            expect(await guard(to)).toBe(false);
            expect(AppLogger.error).toHaveBeenCalled();
        });

        it("identifies permission errors", async () => {
            const to = createMockRoute("/test", {
                allowedRoles: [AdminRole.ADMIN],
                requiresAuth: true,
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

        it("handles auth errors gracefully", async () => {
            const to = createMockRoute("/test", { requiresAuth: true });

            vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Firebase auth error"));

            const res = await guard(to);

            expect(AppLogger.error).toHaveBeenCalledWith(
                "[Auth Guard] Navigation error:",
                expect.objectContaining({
                    message: "Firebase auth error",
                }),
            );
            expect(res).toBe(false);
        });
    });

    describe("Navigation", () => {
        it("shows and hides loading state", async () => {
            const to = createMockRoute("/test");

            await guard(to);

            expect(Loading.show).toHaveBeenCalledWith({
                delay: 200,
                message: "Loading...",
            });
            expect(Loading.hide).toHaveBeenCalled();
        });
    });

    describe("Concurrency", () => {
        it("handles multiple navigation attempts", async () => {
            const firstNav = guard(createMockRoute("/first"));
            const secondNav = guard(createMockRoute("/second"));

            const res = await Promise.all([firstNav, secondNav]);

            expect(res).toStrictEqual([true, true]);
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined token result", async () => {
            const to = createMockRoute("/admin", {
                allowedRoles: [AdminRole.ADMIN],
                requiresAuth: true,
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve(undefined) as any,
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });

        it("handles undefined role claims", async () => {
            const to = createMockRoute("/admin", {
                allowedRoles: [AdminRole.ADMIN],
                requiresAuth: true,
            });

            mockedAuthStore.setAuthState(AuthState.READY);
            vi.mocked(getCurrentUser).mockResolvedValueOnce({
                getIdTokenResult: () => Promise.resolve({ claims: {} }),
            } as any);

            expect(await guard(to)).toStrictEqual({ name: "home" });
        });
    });
});
