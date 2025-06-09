<script setup lang="ts">
import type { QueuedReservationDoc, ReservationDoc } from "@firetable/types";

import { isAWalkInReservation } from "@firetable/types";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue"; // Assumed to be migrated

const props = defineProps<{
    reservation: QueuedReservationDoc | ReservationDoc;
}>();
</script>

<template>
    <div class="d-flex justify-end">
        <v-chip v-if="isAWalkInReservation(props.reservation)" color="grey">Walk-In</v-chip>
        <ReservationVIPChip v-if="props.reservation.isVIP" />
    </div>
</template>
