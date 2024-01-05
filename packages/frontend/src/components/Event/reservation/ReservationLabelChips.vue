<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import { computed } from "vue";
import { isPlannedReservation } from "@firetable/types";

const props = defineProps<{
    reservation: ReservationDoc;
}>();

const reservationChipLabel = computed(() => {
    return isPlannedReservation(props.reservation) ? "Planned" : "Walk-In";
});

const reservationChipColor = computed(() => {
    return isPlannedReservation(props.reservation) ? "tertiary" : "quaternary";
});
</script>

<template>
    <div class="row justify-end">
        <q-chip :color="reservationChipColor" :label="reservationChipLabel" />
        <q-chip
            color="accent"
            v-if="props.reservation.isVIP"
            label="VIP"
            icon="crown"
            text-color="yellow"
        />
    </div>
</template>
