import type { ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import { isPlannedReservation } from "@firetable/types";
import { computed } from "vue";
import { usePermissionsStore } from "src/stores/permissions-store";

export function useReservationPermissions(reservation: Ref<ReservationDoc>) {
    const authStore = useAuthStore();
    const permissionsStore = usePermissionsStore();
    const user = computed(() => authStore.nonNullableUser);

    const isOwnReservation = computed(function () {
        return user.value.id === reservation.value.creator.id;
    });

    const isCancelled = computed(function () {
        return isPlannedReservation(reservation.value) && reservation.value.cancelled;
    });

    const isGuestArrived = computed(function () {
        return reservation.value.arrived;
    });

    const isLinkedReservation = computed(function () {
        return (
            Array.isArray(reservation.value.tableLabel) && reservation.value.tableLabel.length > 1
        );
    });

    const canDeleteReservation = computed(function () {
        return (
            permissionsStore.canDeleteReservation ||
            (isOwnReservation.value && permissionsStore.canDeleteOwnReservation)
        );
    });
    const canEditReservation = computed(function () {
        return (
            permissionsStore.canEditReservation ||
            (isOwnReservation.value && permissionsStore.canEditOwnReservation)
        );
    });

    const canMoveToQueue = computed(function () {
        return (
            (permissionsStore.canReserve || isOwnReservation.value) &&
            !isCancelled.value &&
            !isGuestArrived.value
        );
    });

    const canCancel = computed(function () {
        return (
            isPlannedReservation(reservation.value) &&
            permissionsStore.canCancelReservation &&
            !isGuestArrived.value
        );
    });

    return {
        isLinkedReservation,
        isGuestArrived,
        isCancelled,
        canCancel,
        canMoveToQueue,
        canEditReservation,
        canDeleteReservation,
    };
}
