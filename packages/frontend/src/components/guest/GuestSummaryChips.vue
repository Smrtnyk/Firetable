<script setup lang="ts">
import type { GuestSummary } from "src/stores/guests-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    summary: GuestSummary;
}

const { summary } = defineProps<Props>();
const { t } = useI18n();

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
    <q-chip text-color="white" color="tertiary" size="sm" class="q-ml-none"
        >{{ t("GuestSummaryChips.reservations") }}: {{ summary.totalReservations }}</q-chip
    >
    <q-chip size="sm">{{ t("GuestSummaryChips.arrived") }}: {{ summary.fulfilledVisits }} </q-chip>
    <q-chip :color="reservationColor" size="sm">{{ summary.visitPercentage }}%</q-chip>
</template>
