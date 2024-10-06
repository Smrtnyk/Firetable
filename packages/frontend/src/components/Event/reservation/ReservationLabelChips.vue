<script setup lang="ts">
import type { QueuedReservationDoc, ReservationDoc } from "@firetable/types";
import { isAWalkInReservation } from "@firetable/types";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";

const props = defineProps<{
    reservation: QueuedReservationDoc | ReservationDoc;
}>();
</script>

<template>
    <div class="row justify-end">
        <q-chip v-if="isAWalkInReservation(props.reservation)" color="quaternary" label="Walk-In" />
        <ReservationVIPChip v-if="props.reservation.isVIP" />
    </div>
</template>
