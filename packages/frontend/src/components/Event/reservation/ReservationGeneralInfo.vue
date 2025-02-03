<script setup lang="ts">
import type { PlannedReservation, QueuedReservation, Reservation } from "@firetable/types";

import { isAWalkInReservation } from "@firetable/types";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { usePermissionsStore } from "src/stores/permissions-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
    reservation: QueuedReservation | Reservation;
    timezone: string;
}>();
const { locale, t } = useI18n();
const permissionsStore = usePermissionsStore();

const createdAt = computed(function () {
    const createdAtValue = props.reservation.creator.createdAt;
    return getFormatedDateFromTimestamp(createdAtValue, locale.value, props.timezone);
});

function createdByText(creator: Reservation["creator"]): string {
    const { email, name } = creator;
    return `${name} - ${email}`;
}

function reservedByText(reservedBy: PlannedReservation["reservedBy"]): string {
    const { email, name } = reservedBy;
    const isSocial = email.startsWith("social");
    return isSocial ? name : `${name} - ${email}`;
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
