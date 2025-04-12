import type { ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";

import { isPlannedReservation, ReservationState } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useReservationPermissions(reservation: Ref<ReservationDoc>) {
    const authStore = useAuthStore();
    const permissionsStore = usePermissionsStore();
    const user = computed(() => authStore.nonNullableUser);
    const { t } = useI18n();

    const reservationStateWithTranslationMap = {
        [ReservationState.ARRIVED]: {
            label: t("EventShowReservation.reservationGuestArrivedLabel"),
            value: ReservationState.ARRIVED,
        },
        [ReservationState.CONFIRMED]: {
            label: t("EventShowReservation.reservationConfirmedLabel"),
            value: ReservationState.CONFIRMED,
        },
        [ReservationState.PENDING]: {
            label: t("EventShowReservation.pendingLabel"),
            value: ReservationState.PENDING,
        },
        [ReservationState.WAITING_FOR_RESPONSE]: {
            label: t("EventShowReservation.waitingForResponse"),
            value: ReservationState.WAITING_FOR_RESPONSE,
        },
    } as const;

    const isOwnReservation = computed(function () {
        return user.value.id === reservation.value.creator.id;
    });

    const isCancelled = computed(function () {
        return isPlannedReservation(reservation.value) && reservation.value.cancelled;
    });

    const isGuestArrived = computed(function () {
        return reservation.value.arrived;
    });

    const reservationConfirmed = computed(
        () => isPlannedReservation(reservation.value) && reservation.value.reservationConfirmed,
    );

    const waitingForResponse = computed(
        () =>
            isPlannedReservation(reservation.value) &&
            Boolean(reservation.value.waitingForResponse),
    );

    const isLinkedReservation = computed(function () {
        return (
            Array.isArray(reservation.value.tableLabel) && reservation.value.tableLabel.length > 1
        );
    });

    const reservationMappedState = computed(function () {
        if (isGuestArrived.value) {
            return reservationStateWithTranslationMap[ReservationState.ARRIVED];
        }
        if (reservationConfirmed.value) {
            return reservationStateWithTranslationMap[ReservationState.CONFIRMED];
        }
        if (waitingForResponse.value) {
            return reservationStateWithTranslationMap[ReservationState.WAITING_FOR_RESPONSE];
        }
        return reservationStateWithTranslationMap[ReservationState.PENDING];
    });

    const canDeleteReservation = computed(function () {
        return (
            permissionsStore.canDeleteReservation ??
            (isOwnReservation.value && permissionsStore.canDeleteOwnReservation)
        );
    });
    const canEditReservation = computed(function () {
        return (
            permissionsStore.canEditReservation ??
            (isOwnReservation.value && permissionsStore.canEditOwnReservation)
        );
    });

    const canMoveToQueue = computed(function () {
        return (
            (permissionsStore.canReserve ?? isOwnReservation.value) &&
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
        canCancel,
        canDeleteReservation,
        canEditReservation,
        canMoveToQueue,
        isCancelled,
        isGuestArrived,
        isLinkedReservation,
        reservationMappedState,
        reservationStateWithTranslationMap,
    };
}
