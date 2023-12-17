<script setup lang="ts">
import type { Reservation } from "@firetable/types";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";
import { formatEventDate } from "src/helpers/date-utils";

interface Props {
    canDeleteReservation: boolean;
    reservation: Reservation;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete" | "edit" | "transfer" | "copy"): void;
    (e: "confirm" | "reservationConfirmed", confirmed: boolean): void;
}>();
const { t } = useI18n();
const guestArrived = ref<boolean>(props.reservation.confirmed);
const reservationConfirmed = ref<boolean>(!!props.reservation.reservationConfirmed);

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
    emit("confirm", !guestArrived.value);
    guestArrived.value = !guestArrived.value;
}

function onReservationConfirmed(): void {
    emit("reservationConfirmed", !reservationConfirmed.value);
    reservationConfirmed.value = !reservationConfirmed.value;
}
</script>

<template>
    <q-card-section>
        <div class="row">
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

        <q-separator class="q-mt-md" />

        <!-- reservation confirmed -->
        <q-item v-if="authStore.canConfirmReservation" tag="label" class="q-pa-none">
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
                    :model-value="guestArrived"
                    @update:model-value="onGuestArrived"
                    size="lg"
                    unchecked-icon="close"
                    checked-icon="check"
                    color="green"
                    v-close-popup
                />
            </q-item-section>
        </q-item>

        <q-separator class="q-mb-md" />

        <q-item>
            <div v-if="props.canDeleteReservation" class="row q-gutter-sm full-width">
                <q-btn
                    :title="t('Global.delete')"
                    class="no-wrap q-ml-none"
                    icon="trash"
                    color="negative"
                    @click="() => emit('delete')"
                    v-close-popup
                />
                <q-btn
                    :title="t('Global.edit')"
                    icon="pencil"
                    color="positive"
                    @click="() => emit('edit')"
                    v-close-popup
                />
            </div>
            <div v-if="authStore.canReserve" class="row q-gutter-sm full-width justify-end">
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
    </q-card-section>
</template>
