<script setup lang="ts">
import type { ReservationDoc, VoidFunction } from "@firetable/types";
import { useDialog } from "src/composables/useDialog";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

import FTDialog from "src/components/FTDialog.vue";
import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";

interface Props {
    reservations: ReservationDoc[];
    emptyMessage: string;
    timezone: string;
}

const emit = defineEmits<(e: "delete", value: ReservationDoc) => void>();
const props = defineProps<Props>();
const { locale } = useI18n();
const { createDialog } = useDialog();

function showReservation(reservation: ReservationDoc): void {
    createDialog({
        component: FTDialog,
        componentProps: {
            title: "Reservation Details",
            maximized: false,
            component: ReservationGeneralInfo,
            componentPropsObject: {
                reservation,
                timezone: props.timezone,
            },
            listeners: {},
        },
    });
}

function emitDelete(reservation: ReservationDoc, reset: VoidFunction): void {
    reset();
    emit("delete", reservation);
}
</script>

<template>
    <div class="AdminEventReservationsList">
        <q-list v-if="reservations.length > 0">
            <q-slide-item
                @right="({ reset }) => emitDelete(reservation, reset)"
                v-for="reservation in props.reservations"
                :key="reservation.id"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>
                <q-item clickable>
                    <q-item-section @click="showReservation(reservation)">
                        <q-item-label>
                            {{ reservation.guestName }} on
                            {{ reservation.tableLabel }}</q-item-label
                        >
                        <q-item-label v-if="reservation.clearedAt" caption
                            >Cleared at:
                            {{
                                getFormatedDateFromTimestamp(
                                    reservation.clearedAt,
                                    locale,
                                    props.timezone,
                                )
                            }}</q-item-label
                        >
                        <q-item-label caption>
                            <ReservationLabelChips :reservation="reservation" />
                        </q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
        <FTCenteredText v-else>{{ props.emptyMessage }}</FTCenteredText>
    </div>
</template>
