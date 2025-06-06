import { AdminRole, DEFAULT_CAPABILITIES_BY_ROLE, Role, UserCapability } from "@firetable/types";
import { defineStore } from "pinia";
import { computed } from "vue";

import { useAuthStore } from "./auth-store";

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
        return [AdminRole.ADMIN, Role.MANAGER, Role.PROPERTY_OWNER].includes(userRole);
    });

    const canCreateProperties = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_CREATE_PROPERTIES]);
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

    const canExportReservations = computed(function () {
        return canReserve.value && canSeeGuestContact.value;
    });

    const canSeeDigitalDrinkCards = computed(function () {
        return Boolean(capabilities.value[UserCapability.CAN_SEE_DIGITAL_DRINK_CARDS]);
    });

    return {
        canCancelReservation,
        canConfirmReservation,
        canCreateEvents,
        canCreateProperties,
        canDeleteOwnReservation,
        canDeleteReservation,
        canEditFloorPlans,
        canEditOwnReservation,
        canEditReservation,
        canExportReservations,
        canReserve,
        canSeeAnalytics,
        canSeeDigitalDrinkCards,
        canSeeGuestbook,
        canSeeGuestContact,
        canSeeInventory,
        canSeeReservationCreator,
        capabilities,
    };
});
