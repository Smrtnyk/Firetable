<script setup lang="ts">
import type { Reservation, ReservationDoc } from "@firetable/types";
import { isPlannedReservation } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";

import ReservationGeneralInfo from "src/components/Event/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";

interface Props {
    reservation: ReservationDoc;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete" | "edit" | "transfer" | "copy"): void;
    (e: "arrived" | "reservationConfirmed" | "cancel" | "waitingForResponse", value: boolean): void;
}>();
const { t } = useI18n();
const isGuestArrived = ref<boolean>(props.reservation.arrived);
const isCancelled = ref<boolean>(
    isPlannedReservation(props.reservation) && props.reservation.cancelled,
);
const reservationConfirmed = ref(
    isPlannedReservation(props.reservation) && props.reservation.reservationConfirmed,
);
const waitingForResponse = ref(
    isPlannedReservation(props.reservation) && Boolean(props.reservation.waitingForResponse),
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

function onWaitingForResponse(): void {
    emit("waitingForResponse", !waitingForResponse.value);
    waitingForResponse.value = !waitingForResponse.value;
}
</script>

<template>
    <ReservationLabelChips :reservation="props.reservation" />

    <q-card-section>
        <ReservationGeneralInfo :reservation="props.reservation" />

        <template
            v-if="
                !isCancelled &&
                isPlannedReservation(props.reservation) &&
                authStore.canConfirmReservation
            "
        >
            <template v-if="!isGuestArrived && !reservationConfirmed">
                <q-separator />
                <!-- waiting for response -->
                <q-item tag="label" class="q-pa-none">
                    <q-item-section>
                        <q-item-label>
                            {{ t("EventShowReservation.waitingForResponse") }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                        <q-toggle
                            :model-value="waitingForResponse"
                            @update:model-value="onWaitingForResponse"
                            size="lg"
                            unchecked-icon="close"
                            checked-icon="check"
                            color="yellow"
                            v-close-popup
                        />
                    </q-item-section>
                </q-item>
            </template>

            <!-- reservation confirmed -->
            <template v-if="!isGuestArrived">
                <q-separator />
                <q-item tag="label" class="q-pa-none">
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
            </template>

            <!-- guest arrived -->
            <q-separator class="q-ma-none" />
            <q-item tag="label" class="q-pa-none">
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
