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
    <div>
        <v-chip color="tertiary" size="small" class="mr-2"
            >{{ t("GuestSummaryChips.reservations") }}: {{ summary.totalReservations }}</v-chip
        >
        <v-chip size="small" class="mr-2"
            >{{ t("GuestSummaryChips.arrived") }}: {{ summary.fulfilledVisits }}
        </v-chip>
        <v-chip :color="reservationColor" text-color="white" size="small"
            >{{ summary.visitPercentage }}%</v-chip
        >
    </div>
</template>
