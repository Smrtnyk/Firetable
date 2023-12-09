<script setup lang="ts">
import type { Reservation } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ADMIN } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    canDeleteReservation: boolean;
    reservation: Reservation;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete" | "edit" | "transfer" | "copy"): void;
    (e: "confirm", confirmed: boolean): void;
}>();
const { t } = useI18n();
const checked = ref<boolean>(props.reservation.confirmed);
const canSeeCreator = computed(() => {
    return authStore.user?.role === ADMIN;
});
function reservedByText(reservedBy: Reservation["reservedBy"]): string {
    const { name, email } = reservedBy;
    const isSocial = email.startsWith("social");
    return isSocial ? name : `${name} - ${email}`;
}

function createdByText(creator: NonNullable<Reservation["creator"]>): string {
    const { name, email } = creator;
    return `${name} - ${email}`;
}

function onReservationConfirm(): void {
    emit("confirm", !checked.value);
    checked.value = !checked.value;
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

            <template v-if="props.reservation.creator && canSeeCreator">
                <div class="col-6">{{ t("EventShowReservation.createdByLabel") }}</div>
                <div class="col-6 font-black">
                    {{ createdByText(props.reservation.creator) }}
                </div>
            </template>
        </div>

        <q-separator class="q-my-md" />

        <q-item v-if="authStore.canConfirmReservation" tag="label" class="q-pa-none">
            <q-item-section>
                <q-item-label>
                    {{ t("EventShowReservation.guestArrivedLabel") }}
                </q-item-label>
            </q-item-section>
            <q-item-section avatar>
                <q-toggle
                    :model-value="checked"
                    @update:model-value="onReservationConfirm"
                    size="lg"
                    unchecked-icon="close"
                    checked-icon="check"
                    color="green"
                    v-close-popup
                />
            </q-item-section>
        </q-item>
        <q-item>
            <div v-if="props.canDeleteReservation" class="row q-gutter-sm full-width">
                <q-btn
                    :title="t('Global.delete')"
                    class="no-wrap"
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
