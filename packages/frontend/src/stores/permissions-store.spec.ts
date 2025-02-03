import type { AppUser } from "@firetable/types";

import { AdminRole, DEFAULT_CAPABILITIES_BY_ROLE, Role, UserCapability } from "@firetable/types";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "vue";

import { mockedStore } from "../../test-helpers/render-component";
import { useAuthStore } from "./auth-store";
import { usePermissionsStore } from "./permissions-store";

function createTestUser(options: Partial<AppUser> = {}): AppUser {
    return {
        capabilities: undefined,
        email: "test@example.com",
        id: "user1",
        name: "Test User",
        organisationId: "org1",
        relatedProperties: [],
        role: Role.STAFF,
        username: "testuser",
        ...options,
    };
}

describe("permissions-store.ts", () => {
    beforeEach(() => {
        const app = createApp({});
        const pinia = createPinia();
        app.use(pinia);
        setActivePinia(pinia);
    });

    it("calculates canSeeAnalytics for different roles", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);

        // Should have access
        authStore.user = createTestUser({ role: AdminRole.ADMIN });
        expect(permissionsStore.canSeeAnalytics).toBe(true);

        authStore.user = createTestUser({ role: Role.PROPERTY_OWNER });
        expect(permissionsStore.canSeeAnalytics).toBe(true);

        authStore.user = createTestUser({ role: Role.MANAGER });
        expect(permissionsStore.canSeeAnalytics).toBe(true);

        // Should not have access
        authStore.user = createTestUser({ role: Role.STAFF });
        expect(permissionsStore.canSeeAnalytics).toBe(false);

        authStore.user = undefined;
        expect(permissionsStore.canSeeAnalytics).toBe(false);
    });

    it("calculates capabilities correctly", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);
        authStore.user = createTestUser({
            capabilities: {
                [UserCapability.CAN_CREATE_EVENTS]: true,
                [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
            },
            role: Role.STAFF,
        });

        expect(permissionsStore.canCreateEvents).toBe(true);
        expect(permissionsStore.canEditFloorPlans).toBe(false);
    });

    it("prevents access to features when user is not defined", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);
        authStore.user = undefined;

        // Any capability check should throw because capabilities computed prop has the guard
        expect(() => permissionsStore.canCreateEvents).toThrow("User is not defined!");
    });

    it("correctly determines user capabilities based on role", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);

        // Test staff user with default capabilities
        authStore.user = createTestUser({
            // force default capabilities
            capabilities: undefined,
            role: Role.STAFF,
        });

        expect(permissionsStore.canCreateEvents).toBe(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_CREATE_EVENTS],
        );
        expect(permissionsStore.canEditFloorPlans).toBe(
            DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF][UserCapability.CAN_EDIT_FLOOR_PLANS],
        );
    });

    it("respects custom user capabilities over role defaults", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);

        // Test user with custom capabilities that override defaults
        authStore.user = createTestUser({
            capabilities: {
                [UserCapability.CAN_CREATE_EVENTS]: true,
                [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
            },
            role: Role.STAFF,
        });

        expect(permissionsStore.canCreateEvents).toBe(true);
        expect(permissionsStore.canEditFloorPlans).toBe(false);
    });

    it("handles multiple capability checks for the same user", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);

        authStore.user = createTestUser({
            capabilities: {
                [UserCapability.CAN_CREATE_EVENTS]: true,
                [UserCapability.CAN_EDIT_FLOOR_PLANS]: false,
                [UserCapability.CAN_RESERVE]: false,
                [UserCapability.CAN_SEE_INVENTORY]: true,
            },
            role: Role.STAFF,
        });

        expect(permissionsStore.canCreateEvents).toBe(true);
        expect(permissionsStore.canEditFloorPlans).toBe(false);
        expect(permissionsStore.canSeeInventory).toBe(true);
        expect(permissionsStore.canReserve).toBe(false);
    });

    it("handles reservation-related capabilities", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);

        authStore.user = createTestUser({
            capabilities: {
                [UserCapability.CAN_CANCEL_RESERVATION]: true,
                [UserCapability.CAN_CONFIRM_RESERVATION]: true,
                [UserCapability.CAN_DELETE_OWN_RESERVATION]: true,
                [UserCapability.CAN_DELETE_RESERVATION]: false,
                [UserCapability.CAN_EDIT_OWN_RESERVATION]: true,
                [UserCapability.CAN_EDIT_RESERVATION]: true,
            },
            role: Role.STAFF,
        });

        expect(permissionsStore.canEditReservation).toBe(true);
        expect(permissionsStore.canEditOwnReservation).toBe(true);
        expect(permissionsStore.canDeleteReservation).toBe(false);
        expect(permissionsStore.canDeleteOwnReservation).toBe(true);
        expect(permissionsStore.canConfirmReservation).toBe(true);
        expect(permissionsStore.canCancelReservation).toBe(true);
    });

    it("falls back to role defaults when user capabilities are undefined", () => {
        const authStore = mockedStore(useAuthStore);
        const permissionsStore = mockedStore(usePermissionsStore);
        const role = Role.STAFF;

        authStore.user = createTestUser({
            capabilities: undefined,
            role,
        });

        // Check that each capability matches the default for the role
        // @ts-expect-error -- works spreading the enum although ts complains
        Object.values({ ...UserCapability }).forEach((capability) => {
            const defaultValue = DEFAULT_CAPABILITIES_BY_ROLE[role][capability];
            expect(permissionsStore.capabilities[capability]).toBe(defaultValue);
        });
    });
});
