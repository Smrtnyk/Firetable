import { useAuthStore } from "./auth-store";
import { Role, ADMIN, DEFAULT_CAPABILITIES_BY_ROLE, UserCapability } from "@firetable/types";
import { defineStore } from "pinia";
import { computed } from "vue";

export const usePermissionsStore = defineStore("permissions", function () {
    const authStore = useAuthStore();

    const capabilities = computed(function () {
        if (!authStore.user) {
            throw new Error("User is not defined!");
        }
        return authStore.user?.capabilities ?? DEFAULT_CAPABILITIES_BY_ROLE[authStore.user.role];
    });

    const canSeeAnalytics = computed(function () {
        const userRole = authStore.user?.role;
        if (!userRole) {
            return false;
        }
        return [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN].includes(userRole);
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

    const canSeeGuestbook = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_SEE_GUESTBOOK]);
    });

    return {
        capabilities,
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
        canSeeGuestbook,
        canSeeAnalytics,
    };
});
