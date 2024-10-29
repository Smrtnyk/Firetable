<script setup lang="ts">
import type { Visit } from "@firetable/types";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

const { visits } = defineProps<{
    visits: Visit[];
}>();

const { t, locale } = useI18n();

function isUpcomingVisit(visit: Visit): boolean {
    const now = Date.now();
    const visitDate = new Date(visit.date).getTime();
    // Consider the visit upcoming if it's today or in the future and not cancelled
    return visitDate >= now && !visit.cancelled;
}

function getVisitColor(visit: Visit): string {
    if (visit.cancelled) {
        return "warning";
    }
    if (visit.arrived) {
        return "green";
    }
    return "blue";
}

function getVisitIcon(visit: Visit): string {
    if (visit.cancelled) {
        return "close";
    }
    if (visit.arrived) {
        return "check";
    }
    return "dash";
}

function formatSubtitleForGuestVisit(visit: Visit): string {
    return formatEventDate(visit.date, locale.value);
}
</script>

<template>
    <q-card class="ft-card q-px-xs">
        <q-timeline color="primary">
            <q-timeline-entry
                v-for="(visit, index) in visits"
                :key="visit.date + index"
                :color="getVisitColor(visit)"
                :icon="getVisitIcon(visit)"
                :title="visit.eventName"
                :subtitle="formatSubtitleForGuestVisit(visit)"
            >
                <div class="row">
                    <ReservationVIPChip v-if="visit.isVIPVisit" />
                    <q-chip v-if="isUpcomingVisit(visit)" color="orange">
                        {{ t("PageAdminGuest.upcomingChipLabel") }}
                    </q-chip>
                </div>
            </q-timeline-entry>
        </q-timeline>
    </q-card>
</template>
