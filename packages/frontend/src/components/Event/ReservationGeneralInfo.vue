<script setup lang="ts">
import type { WalkInReservation, PlannedReservation, Reservation } from "@firetable/types";
import { isPlannedReservation } from "@firetable/types";
import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";

const props = defineProps<{
    reservation: PlannedReservation | WalkInReservation;
}>();
const { t } = useI18n();
const authStore = useAuthStore();

function reservedByText(reservedBy: PlannedReservation["reservedBy"]): string {
    const { name, email } = reservedBy;
    const isSocial = email.startsWith("social");
    return isSocial ? name : `${name} - ${email}`;
}

function createdByText(creator: Reservation["creator"]): string {
    const { name, email } = creator;
    return `${name} - ${email}`;
}
</script>

<template>
    <div class="row q-mb-md">
        <template v-if="reservation.guestName">
            <div class="col-6">{{ t("EventShowReservation.guestNameLabel") }}</div>
            <div class="col-6 font-black">{{ props.reservation.guestName }}</div>
        </template>

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

        <template v-if="isPlannedReservation(props.reservation)">
            <div class="col-6">{{ t("EventShowReservation.reservedByLabel") }}</div>
            <div class="col-6 font-black">{{ reservedByText(props.reservation.reservedBy) }}</div>
        </template>

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
</template>
