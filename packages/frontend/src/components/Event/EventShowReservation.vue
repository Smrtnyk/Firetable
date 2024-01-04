<script setup lang="ts">
import type { Reservation } from "@firetable/types";
import { isPlannedReservation } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";

import ReservationGeneralInfo from "src/components/Event/ReservationGeneralInfo.vue";

interface Props {
    reservation: Reservation;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete" | "edit" | "transfer" | "copy"): void;
    (e: "arrived" | "reservationConfirmed" | "cancel", value: boolean): void;
}>();
const { t } = useI18n();
const isGuestArrived = ref<boolean>(props.reservation.arrived);
const isCancelled = ref<boolean>(
    isPlannedReservation(props.reservation) && !!props.reservation.cancelled,
);
const reservationConfirmed = ref<boolean>(
    isPlannedReservation(props.reservation) && !!props.reservation.reservationConfirmed,
);
const canDeleteReservation = computed(() => {
    return (
        authStore.canDeleteReservation ||
        (isOwnReservation(props.reservation) && authStore.canDeleteOwnReservation)
    );
});
const canEditReservation = computed(() => {
    return (
        authStore.canEditReservation ||
        (isOwnReservation(props.reservation) && authStore.canEditOwnReservation)
    );
});

function isOwnReservation(reservation: Reservation): boolean {
    return authStore.user?.id === reservation.creator?.id;
}

function onGuestArrived(): void {
    emit("arrived", !isGuestArrived.value);
    isGuestArrived.value = !isGuestArrived.value;
}

function onReservationCancel(): void {
    emit("cancel", !isCancelled.value);
    isCancelled.value = !isCancelled.value;
}

function onReservationConfirmed(): void {
    emit("reservationConfirmed", !reservationConfirmed.value);
    reservationConfirmed.value = !reservationConfirmed.value;
}

const reservationChipLabel = computed(() => {
    return isPlannedReservation(props.reservation) ? "Planned" : "Walk-In";
});

const reservationChipColor = computed(() => {
    return isPlannedReservation(props.reservation) ? "tertiary" : "quaternary";
});
</script>

<template>
    <div class="row justify-end">
        <q-chip :color="reservationChipColor" :label="reservationChipLabel" />
        <q-chip
            color="accent"
            v-if="props.reservation.isVIP"
            label="VIP"
            icon="crown"
            text-color="yellow"
        />
    </div>

    <q-card-section>
        <ReservationGeneralInfo :reservation="props.reservation" />

        <template v-if="!isCancelled && isPlannedReservation(props.reservation)">
            <q-separator />
            <!-- reservation confirmed -->
            <q-item
                v-if="authStore.canConfirmReservation && !isGuestArrived"
                tag="label"
                class="q-pa-none"
            >
                <q-item-section>
                    <q-item-label>
                        {{ t("EventShowReservation.reservationConfirmedLabel") }}
                    </q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :model-value="reservationConfirmed"
                        @update:model-value="onReservationConfirmed"
                        size="lg"
                        unchecked-icon="close"
                        checked-icon="check"
                        color="primary"
                        v-close-popup
                    />
                </q-item-section>
            </q-item>

            <q-separator class="q-ma-none" />

            <!-- guest arrived -->
            <q-item v-if="authStore.canConfirmReservation" tag="label" class="q-pa-none">
                <q-item-section>
                    <q-item-label>
                        {{ t("EventShowReservation.guestArrivedLabel") }}
                    </q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :model-value="isGuestArrived"
                        @update:model-value="onGuestArrived"
                        size="lg"
                        unchecked-icon="close"
                        checked-icon="check"
                        color="green"
                        v-close-popup
                    />
                </q-item-section>
            </q-item>
        </template>

        <q-separator class="q-mb-md" />

        <q-item>
            <div class="row q-gutter-sm full-width">
                <q-btn
                    v-if="canDeleteReservation"
                    :title="t('Global.delete')"
                    class="no-wrap q-ml-none"
                    icon="trash"
                    color="negative"
                    @click="() => emit('delete')"
                    v-close-popup
                />
                <q-btn
                    v-if="canEditReservation && !isCancelled"
                    :title="t('Global.edit')"
                    icon="pencil"
                    color="positive"
                    @click="() => emit('edit')"
                    v-close-popup
                />
            </div>
            <div
                v-if="authStore.canReserve && !isCancelled"
                class="row q-gutter-sm full-width justify-end"
            >
                <q-btn
                    :title="t('Global.transfer')"
                    icon="transfer"
                    color="primary"
                    @click="() => emit('transfer')"
                    v-close-popup
                />
                <q-btn
                    :title="t('Global.copy')"
                    icon="copy"
                    color="primary"
                    @click="() => emit('copy')"
                    v-close-popup
                />
            </div>
        </q-item>

        <template
            v-if="
                isPlannedReservation(props.reservation) &&
                authStore.canCancelReservation &&
                !isGuestArrived
            "
        >
            <q-separator class="q-mt-md" />
            <!-- Cancel reservation -->
            <q-item tag="label" class="q-pa-none">
                <q-item-section>
                    <q-item-label>
                        {{ t("EventShowReservation.cancel") }}
                    </q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :model-value="isCancelled"
                        @update:model-value="onReservationCancel"
                        size="lg"
                        unchecked-icon="close"
                        checked-icon="close"
                        color="warning"
                        v-close-popup
                    />
                </q-item-section>
            </q-item>
        </template>
    </q-card-section>
</template>
