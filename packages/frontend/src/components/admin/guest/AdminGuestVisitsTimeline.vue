<script setup lang="ts">
import type { Visit } from "@firetable/types";

import EditVisitDialog from "src/components/admin/guest/EditVisitDialog.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import { globalDialog } from "src/composables/useDialog";
import { updateGuestVisit } from "src/db";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { formatEventDate } from "src/helpers/date-utils";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";

interface Props {
    guestId: string;
    organisationId: string;
    propertyId: string;
    timezone: string;
    visits: Visit[];
}

const { buttonSize } = useScreenDetection();

const emit = defineEmits<(e: "visit-updated") => void>();

const { locale, t } = useI18n();
const { guestId, organisationId, propertyId, timezone, visits } = defineProps<Props>();

function formatSubtitleForGuestVisit(visit: Visit): string {
    return formatEventDate(visit.date, locale.value, timezone);
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
        return "fas fa-times";
    }
    if (visit.arrived) {
        return "fas fa-check";
    }
    return "fas fa-minus";
}

function isUpcomingVisit(visit: Visit): boolean {
    const now = Date.now();
    const visitDate = new Date(visit.date).getTime();
    // Consider the visit upcoming if it's today or in the future and not cancelled
    return visitDate >= now && !visit.cancelled;
}

function openEditDialog(visit: Visit): void {
    const dialog = globalDialog.openDialog(
        EditVisitDialog,
        {
            onUpdate(updatedVisit: Visit) {
                tryCatchLoadingWrapper({
                    async hook() {
                        await updateGuestVisit(organisationId, propertyId, guestId, updatedVisit);
                        emit("visit-updated");
                        dialog.hide();
                    },
                });
            },
            visit: { ...visit },
        },
        {
            title: t("PageAdminGuest.editVisitTitle"),
        },
    );
}
</script>

<template>
    <v-card class="ft-card pa-1 pa-md-4">
        <v-timeline side="end" align="start" density="compact">
            <v-timeline-item
                v-for="(visit, index) in visits"
                :key="visit.date + index"
                :dot-color="getVisitColor(visit)"
                size="small"
            >
                <template #icon>
                    <v-icon :icon="getVisitIcon(visit)" color="white" size="x-small"></v-icon>
                </template>

                <div class="text-h6">{{ visit.eventName }}</div>
                <div class="text-caption">{{ formatSubtitleForGuestVisit(visit) }}</div>

                <div class="d-flex align-center mt-2">
                    <div class="flex-grow-1">
                        <ReservationVIPChip v-if="visit.isVIPVisit" />
                        <v-chip v-if="isUpcomingVisit(visit)" color="orange" size="small">
                            {{ t("PageAdminGuest.upcomingChipLabel") }}
                        </v-chip>
                    </div>
                    <div>
                        <v-btn
                            variant="text"
                            icon="fas fa-pencil-alt"
                            :size="buttonSize"
                            @click="openEditDialog(visit)"
                        />
                    </div>
                </div>
            </v-timeline-item>
        </v-timeline>
    </v-card>
</template>
