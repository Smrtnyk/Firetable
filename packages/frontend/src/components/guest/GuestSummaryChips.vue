<script setup lang="ts">
import type { GuestSummary } from "src/stores/guests-store";
import { computed } from "vue";

interface Props {
    summary: GuestSummary;
}

const { summary } = defineProps<Props>();

const reservationColor = computed(function () {
    const percentage = Number.parseFloat(summary.visitPercentage);
    if (percentage >= 75) {
        return "green";
    }

    if (percentage >= 50) {
        return "orange";
    }

    return "red";
});
</script>

<template>
    <q-chip text-color="white" color="tertiary" size="sm"
        >Bookings: {{ summary.totalReservations }}</q-chip
    >
    <q-chip size="sm"> Arrived: {{ summary.fulfilledVisits }} </q-chip>
    <q-chip :color="reservationColor" size="sm">{{ summary.visitPercentage }}%</q-chip>
</template>
