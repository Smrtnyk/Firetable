<script setup lang="ts">
import type { Visit } from "@firetable/types";

import { updateGuestVisit } from "@firetable/backend";
import EditVisitDialog from "src/components/admin/guest/EditVisitDialog.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import FTDialog from "src/components/FTDialog.vue";
import { useDialog } from "src/composables/useDialog";
import { buttonSize } from "src/global-reactives/screen-detection";
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

const emit = defineEmits<(e: "visit-updated") => void>();

const { locale, t } = useI18n();
const { createDialog } = useDialog();
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
        return "close";
    }
    if (visit.arrived) {
        return "check";
    }
    return "dash";
}

function isUpcomingVisit(visit: Visit): boolean {
    const now = Date.now();
    const visitDate = new Date(visit.date).getTime();
    // Consider the visit upcoming if it's today or in the future and not cancelled
    return visitDate >= now && !visit.cancelled;
}

function openEditDialog(visit: Visit): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EditVisitDialog,
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
            maximized: false,
            title: t("PageAdminGuest.editVisitTitle"),
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
