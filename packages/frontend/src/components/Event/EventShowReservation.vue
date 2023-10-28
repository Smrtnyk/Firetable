<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Reservation, Role } from "@firetable/types";
import { useAuthStore } from "stores/auth-store";

interface Props {
    reservation: Reservation;
}

const authStore = useAuthStore();
const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "delete"): void;
    (e: "confirm", confirmed: boolean): void;
}>();
const { t } = useI18n();
const checked = ref<boolean>(props.reservation.confirmed);
const isStaff = computed(() => {
    return authStore.user?.role === Role.STAFF;
});

function onReservationConfirm() {
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
                <div class="col-6 font-black">{{ t("EventShowReservation.timeLabel") }}</div>
                <div class="col-6 font-black">
                    {{ props.reservation.time }}
                </div>
            </template>

            <div class="col-6">{{ t("EventShowReservation.numberOfPeopleLabel") }}</div>
            <div class="col-6 font-black">
                {{ props.reservation.numberOfGuests }}
            </div>

            <template v-if="props.reservation.guestContact && !isStaff">
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

            <div class="col-6 font-black">
                {{ props.reservation.reservedBy.email }}
            </div>
        </div>

        <q-separator class="q-my-md" />

        <q-item v-if="!isStaff" tag="label" class="q-pa-none">
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
                />
            </q-item-section>
        </q-item>
        <q-item>
            <q-item-section>
                <q-btn
                    :label="t('EventShowReservation.deleteReservationLabel')"
                    outline
                    icon="trash"
                    color="negative"
                    @click="() => emit('delete')"
                    v-close-popup
                />
            </q-item-section>
        </q-item>
    </q-card-section>
</template>
