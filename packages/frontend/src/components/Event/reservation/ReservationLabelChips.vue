<script setup lang="ts">
import type { QueuedReservationDoc, ReservationDoc } from "@firetable/types";

import { isAWalkInReservation } from "@firetable/types";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";

const props = defineProps<{
    reservation: QueuedReservationDoc | ReservationDoc;
}>();
</script>

<template>
    <div>
        <v-chip
            v-if="isAWalkInReservation(props.reservation)"
            color="grey"
            class="mr-2"
            size="small"
            >Walk-In</v-chip
        >
        <ReservationVIPChip v-if="props.reservation.isVIP" />
    </div>
</template>
