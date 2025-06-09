<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";

import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { globalDialog } from "src/composables/useDialog";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

interface Props {
    emptyMessage: string;
    reservations: ReservationDoc[];
    timezone: string;
}

const emit = defineEmits<(e: "delete", value: ReservationDoc) => void>();
const props = defineProps<Props>();
const { locale } = useI18n();

function emitDelete(reservation: ReservationDoc): void {
    emit("delete", reservation);
}

function showReservation(reservation: ReservationDoc): void {
    globalDialog.openDialog(
        ReservationGeneralInfo,
        {
            reservation,
            timezone: props.timezone,
        },
        {
            title: "Reservation Details",
        },
    );
}
</script>

<template>
    <div class="AdminEventReservationsList">
        <v-list v-if="reservations.length > 0" lines="three">
            <v-list-item
                v-for="reservation in props.reservations"
                :key="reservation.id"
                @click="showReservation(reservation)"
                link
            >
                <v-list-item-title>
                    {{ reservation.guestName }} on {{ reservation.tableLabel }}</v-list-item-title
                >
                <v-list-item-subtitle v-if="reservation.clearedAt"
                    >Cleared at:
                    {{
                        getFormatedDateFromTimestamp(reservation.clearedAt, locale, props.timezone)
                    }}</v-list-item-subtitle
                >
                <v-list-item-subtitle>
                    <ReservationLabelChips :reservation="reservation" />
                </v-list-item-subtitle>

                <template #append>
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click.stop="emitDelete(reservation)"
                        aria-label="Delete reservation"
                    >
                        <v-icon icon="fa fa-trash"></v-icon>
                    </v-btn>
                </template>
            </v-list-item>
        </v-list>
        <FTCenteredText v-else>{{ props.emptyMessage }}</FTCenteredText>
    </div>
</template>
