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
    <v-row class="mb-4">
        <template v-if="reservation.guestName">
            <v-col cols="6">{{ t("EventShowReservation.guestNameLabel") }}</v-col>
            <v-col cols="6" class="font-black">{{ props.reservation.guestName }}</v-col>
        </template>

        <v-col cols="6">{{ t("EventShowReservation.timeLabel") }}</v-col>
        <v-col cols="6" class="font-black">{{ props.reservation.time }}</v-col>

        <v-col cols="6">{{ t("EventShowReservation.numberOfPeopleLabel") }}</v-col>
        <v-col cols="6" class="font-black">{{ props.reservation.numberOfGuests }}</v-col>

        <template v-if="props.reservation.guestContact && permissionsStore.canSeeGuestContact">
            <v-col cols="6">{{ t("EventShowReservation.contactLabel") }}</v-col>
            <v-col cols="6" class="font-black">{{ props.reservation.guestContact }}</v-col>
        </template>

        <template v-if="props.reservation.consumption">
            <v-col cols="6">{{ t("EventShowReservation.reservationConsumption") }}</v-col>
            <v-col cols="6" class="font-black">{{ props.reservation.consumption }}</v-col>
        </template>

        <template v-if="props.reservation.reservationNote">
            <v-col cols="6">{{ t("EventShowReservation.noteLabel") }}</v-col>
            <v-col cols="6" class="font-black">{{ props.reservation.reservationNote }}</v-col>
        </template>

        <template v-if="!isAWalkInReservation(props.reservation)">
            <v-col cols="6">{{ t("EventShowReservation.reservedByLabel") }}</v-col>
            <v-col cols="6" class="font-black">{{
                reservedByText(props.reservation.reservedBy)
            }}</v-col>
        </template>

        <template v-if="permissionsStore.canSeeReservationCreator">
            <v-col cols="6">{{ t("EventShowReservation.createdByLabel") }}</v-col>
            <v-col cols="6" class="font-black">{{
                createdByText(props.reservation.creator)
            }}</v-col>

            <v-col cols="6">{{ t("EventShowReservation.createdAtLabel") }}</v-col>
            <v-col cols="6" class="font-black">
                {{ createdAt }}
            </v-col>
        </template>
    </v-row>
</template>
