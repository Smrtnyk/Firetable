<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Reservation } from "@firetable/types";

interface Props {
    reservation: Reservation;
}

const props = defineProps<Props>();
const emit = defineEmits(["delete", "confirm"]);
const { t } = useI18n();
const checked = ref<boolean>(props.reservation.confirmed);
const confirmGuestSwitchDisabled = ref(false);

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

            <div class="col-6">{{ t("EventShowReservation.numberOfPeopleLabel") }}</div>
            <div class="col-6 font-black">
                {{ props.reservation.numberOfGuests }}
            </div>

            <template v-if="props.reservation.guestContact">
                <div class="col-6">{{ t("EventShowReservation.contactLabel") }}</div>
                <div class="col-6 font-black">{{ props.reservation.guestContact }}</div>
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

        <div class="row items-center" v-if="props.reservation.groupedWith?.length > 1">
            <q-separator dark class="q-my-md col-12" />
            <div class="col-6">{{ t("EventShowReservation.groupedWithLabel") }}</div>
            <div class="col-6">
                <q-chip
                    v-for="table in props.reservation.groupedWith"
                    :key="table"
                    square
                    class="bg-gradient"
                    text-color="white"
                >
                    {{ table }}
                </q-chip>
            </div>
        </div>

        <q-separator class="q-my-md" />

        <q-item tag="label" class="q-pa-none">
            <q-item-section>
                <q-item-label>
                    {{ t("EventShowReservation.guestArrivedLabel") }}
                </q-item-label>
            </q-item-section>
            <q-item-section avatar>
                <q-toggle
                    :model-value="checked"
                    @update:model-value="onReservationConfirm"
                    :disable="confirmGuestSwitchDisabled"
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
                    label="Delete Reservation"
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
