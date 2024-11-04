<script setup lang="ts">
import type { PlannedReservation, QueuedReservation, Reservation } from "@firetable/types";
import { isAWalkInReservation } from "@firetable/types";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { usePermissionsStore } from "src/stores/permissions-store";

const props = defineProps<{
    reservation: QueuedReservation | Reservation;
    timezone: string;
}>();
const { t, locale } = useI18n();
const permissionsStore = usePermissionsStore();

const createdAt = computed(() => {
    const createdAtValue = props.reservation.creator.createdAt;
    return getFormatedDateFromTimestamp(createdAtValue, locale.value, props.timezone);
});

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

        <div class="col-6">{{ t("EventShowReservation.timeLabel") }}</div>
        <div class="col-6 font-black">{{ props.reservation.time }}</div>

        <div class="col-6">{{ t("EventShowReservation.numberOfPeopleLabel") }}</div>
        <div class="col-6 font-black">{{ props.reservation.numberOfGuests }}</div>

        <template v-if="props.reservation.guestContact && permissionsStore.canSeeGuestContact">
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

        <template v-if="!isAWalkInReservation(props.reservation)">
            <div class="col-6">{{ t("EventShowReservation.reservedByLabel") }}</div>
            <div class="col-6 font-black">{{ reservedByText(props.reservation.reservedBy) }}</div>
        </template>

        <template v-if="permissionsStore.canSeeReservationCreator">
            <div class="col-6">{{ t("EventShowReservation.createdByLabel") }}</div>
            <div class="col-6 font-black">{{ createdByText(props.reservation.creator) }}</div>

            <div class="col-6">{{ t("EventShowReservation.createdAtLabel") }}</div>
            <div class="col-6 font-black">
                {{ createdAt }}
            </div>
        </template>
    </div>
</template>
