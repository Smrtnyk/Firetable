<script setup lang="ts">
import type { Reservation } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";
import { formatEventDate } from "src/helpers/date-utils";

interface Props {
    reservation: Reservation;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete" | "edit" | "transfer" | "copy"): void;
    (e: "confirm" | "reservationConfirmed" | "cancel", value: boolean): void;
}>();
const { t } = useI18n();
const isGuestArrived = ref<boolean>(props.reservation.confirmed);
const isCancelled = ref<boolean>(!!props.reservation.cancelled);
const reservationConfirmed = ref<boolean>(!!props.reservation.reservationConfirmed);
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

function reservedByText(reservedBy: Reservation["reservedBy"]): string {
    const { name, email } = reservedBy;
    const isSocial = email.startsWith("social");
    return isSocial ? name : `${name} - ${email}`;
}

function createdByText(creator: NonNullable<Reservation["creator"]>): string {
    const { name, email } = creator;
    return `${name} - ${email}`;
}

function onGuestArrived(): void {
    emit("confirm", !isGuestArrived.value);
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
</script>

<template>
    <q-card-section>
        <div class="row q-mb-md">
            <div class="col-6">{{ t("EventShowReservation.guestNameLabel") }}</div>
            <div class="col-6 font-black">{{ props.reservation.guestName }}</div>

            <template v-if="props.reservation.time">
                <div class="col-6">{{ t("EventShowReservation.timeLabel") }}</div>
                <div class="col-6 font-black">
                    {{ props.reservation.time }}
                </div>
            </template>

            <div class="col-6">{{ t("EventShowReservation.numberOfPeopleLabel") }}</div>
            <div class="col-6 font-black">
                {{ props.reservation.numberOfGuests }}
            </div>

            <template v-if="props.reservation.guestContact && authStore.canSeeGuestContact">
                <div class="col-6">{{ t("EventShowReservation.contactLabel") }}</div>
                <div class="col-6 font-black">{{ props.reservation.guestContact }}</div>
            </template>

            <template v-if="props.reservation.consumption">
                <div class="col-6">{{ t("EventShowReservation.reservationConsumption") }}</div>
                <div class="col-6 font-black">{{ props.reservation.consumption }}</div>
            </template>

            <template v-if="props.reservation.reservationNote">
                <div class="col-6">{{ t("EventShowReservation.noteLabel") }}</div>
                <div class="col-6 font-black">{{ props.reservation.reservationNote }}</div>
            </template>

            <div class="col-6">{{ t("EventShowReservation.reservedByLabel") }}</div>
            <div class="col-6 font-black">{{ reservedByText(props.reservation.reservedBy) }}</div>

            <template v-if="props.reservation.creator && authStore.canSeeReservationCreator">
                <div class="col-6">{{ t("EventShowReservation.createdByLabel") }}</div>
                <div class="col-6 font-black">
                    {{ createdByText(props.reservation.creator) }}
                </div>

                <template v-if="props.reservation.creator.createdAt">
                    <div class="col-6">Created at</div>
                    <div class="col-6 font-black">
                        {{ formatEventDate(props.reservation.creator.createdAt.toMillis()) }}
                    </div>
                </template>
            </template>
        </div>

        <template v-if="!isCancelled">
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

        <template v-if="authStore.canCancelReservation && !isGuestArrived">
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
