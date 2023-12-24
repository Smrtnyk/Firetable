<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import { useDialog } from "src/composables/useDialog";
import FTDialog from "src/components/FTDialog.vue";
import ReservationGeneralInfo from "src/components/Event/ReservationGeneralInfo.vue";

interface Props {
    reservations: ReservationDoc[];
}

const props = defineProps<Props>();
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
            },
        },
    });
}
</script>

<template>
    <q-list>
        <q-item v-for="reservation in props.reservations" :key="reservation.id" clickable>
            <q-item-section @click="showReservation(reservation)">
                <q-item-label>
                    {{ reservation.guestName }} on {{ reservation.tableLabel }}</q-item-label
                >
            </q-item-section>
        </q-item>
    </q-list>
</template>
