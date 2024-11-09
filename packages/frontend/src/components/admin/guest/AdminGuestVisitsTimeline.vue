<script setup lang="ts">
import type { Visit } from "@firetable/types";
import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { updateGuestVisit } from "@firetable/backend";
import { useDialog } from "src/composables/useDialog";
import { buttonSize } from "src/global-reactives/screen-detection";

import FTDialog from "src/components/FTDialog.vue";
import EditVisitDialog from "src/components/admin/guest/EditVisitDialog.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";

interface Props {
    visits: Visit[];
    timezone: string;
    organisationId: string;
    propertyId: string;
    guestId: string;
}

const emit = defineEmits<(e: "visit-updated") => void>();

const { t, locale } = useI18n();
const { createDialog } = useDialog();
const { visits, timezone, propertyId, organisationId, guestId } = defineProps<Props>();

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
    return formatEventDate(visit.date, locale.value, timezone);
}

function openEditDialog(visit: Visit): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminGuest.editVisitTitle"),
            component: EditVisitDialog,
            maximized: false,
            componentPropsObject: {
                visit: { ...visit },
            },
            listeners: {
                update(updatedVisit: Visit) {
                    tryCatchLoadingWrapper({
                        async hook() {
                            await updateGuestVisit(
                                organisationId,
                                propertyId,
                                guestId,
                                updatedVisit,
                            );
                            emit("visit-updated");
                            dialog.hide();
                        },
                    });
                },
            },
        },
    });
}
</script>

<template>
    <q-card class="ft-card q-pa-xs q-pa-md-md">
        <q-timeline color="primary">
            <q-timeline-entry
                class="q-ml-md"
                v-for="(visit, index) in visits"
                :key="visit.date + index"
                :color="getVisitColor(visit)"
                :icon="getVisitIcon(visit)"
                :title="visit.eventName"
                :subtitle="formatSubtitleForGuestVisit(visit)"
            >
                <div class="row items-center">
                    <div class="col">
                        <ReservationVIPChip v-if="visit.isVIPVisit" />
                        <q-chip v-if="isUpcomingVisit(visit)" color="orange">
                            {{ t("PageAdminGuest.upcomingChipLabel") }}
                        </q-chip>
                    </div>
                    <div class="col-auto">
                        <q-btn
                            flat
                            round
                            :size="buttonSize"
                            icon="pencil"
                            @click="openEditDialog(visit)"
                        />
                    </div>
                </div>
            </q-timeline-entry>
        </q-timeline>
    </q-card>
</template>
