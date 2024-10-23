<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc, Visit } from "@firetable/types";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { deleteGuest, getGuestPath, updateGuestInfo } from "@firetable/backend";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { formatEventDate } from "src/helpers/date-utils";

import FTTitle from "src/components/FTTitle.vue";
import FTTabs from "src/components/FTTabs.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import { matchesProperty } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";
import FTDialog from "src/components/FTDialog.vue";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

export interface PageAdminGuestProps {
    organisationId: string;
    guestId: string;
}

interface VisitsByProperty {
    [propertyId: string]: {
        name: string;
        visits: Visit[];
    };
}
const router = useRouter();
const { createDialog } = useDialog();
const { properties } = storeToRefs(usePropertiesStore());
const { t } = useI18n();
const { organisationId, guestId } = defineProps<PageAdminGuestProps>();
const { data: guest } = useFirestoreDocument<GuestDoc>(getGuestPath(organisationId, guestId), {
    once: true,
});

const tab = ref("");
const propertiesVisits = computed(function () {
    const visitsByProperty: VisitsByProperty = {};
    for (const [propertyId, events] of Object.entries(guest.value?.visitedProperties ?? {})) {
        const propertyData = properties.value.find(matchesProperty("id", propertyId));
        if (!propertyData) {
            continue;
        }

        const sortedVisits = (Object.values(events || {}).filter(Boolean) as Visit[]).sort(
            function (a, b) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            },
        );

        if (sortedVisits.length > 0) {
            visitsByProperty[propertyId] = {
                name: propertyData.name,
                visits: sortedVisits,
            };
        }
    }
    return visitsByProperty;
});

watch(
    propertiesVisits,
    function (newVisits) {
        if (Object.keys(newVisits).length > 0) {
            tab.value = Object.keys(newVisits)[0];
        }
    },
    { immediate: true },
);

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
    return formatEventDate(visit.date);
}

async function editGuest(guestVal: GuestDoc): Promise<void> {
    const shouldEdit = await showConfirm(
        t("PageAdminGuest.editGuestConfirmMsg", {
            name: guestVal.name,
        }),
    );
    if (!shouldEdit) {
        return;
    }

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewGuestForm,
            componentPropsObject: {
                mode: "edit",
                initialData: guestVal,
            },
            maximized: false,
            title: t("PageAdminGuest.editGuestDialogTitle", {
                name: guestVal.name,
            }),
            listeners: {
                update(updatedData: CreateGuestPayload) {
                    dialog.hide();
                    return tryCatchLoadingWrapper({
                        hook() {
                            return updateGuestInfo(organisationId, guestId, updatedData);
                        },
                    });
                },
            },
        },
    });
}

async function onDeleteGuest(): Promise<void> {
    const shouldDelete = await showConfirm(
        t("PageAdminGuest.deleteGuestConfirmTitle"),
        t("PageAdminGuest.deleteGuestConfirmMessage"),
    );
    if (!shouldDelete) {
        return;
    }

    return tryCatchLoadingWrapper({
        async hook() {
            await deleteGuest(organisationId, guestId);
            router.back();
        },
    });
}
</script>

<template>
    <div class="PageAdminGuest">
        <div v-if="guest">
            <FTTitle :title="guest.name" :subtitle="guest.contact">
                <template #right>
                    <q-btn
                        class="q-mr-sm"
                        rounded
                        icon="pencil"
                        color="secondary"
                        @click="editGuest(guest)"
                        aria-label="Edit guest"
                    />
                    <q-btn
                        rounded
                        icon="trash"
                        color="negative"
                        @click="onDeleteGuest()"
                        aria-label="Delete guest"
                    />
                </template>
            </FTTitle>

            <div v-if="Object.keys(propertiesVisits).length > 0">
                <FTTabs v-model="tab">
                    <q-tab
                        v-for="(item, propertyId) in propertiesVisits"
                        :key="propertyId"
                        :name="propertyId"
                        :label="item.name"
                    />
                </FTTabs>
                <FTTabPanels v-model="tab">
                    <q-tab-panel
                        v-for="(item, propertyId) in propertiesVisits"
                        :key="propertyId"
                        :name="propertyId"
                    >
                        <q-timeline color="primary">
                            <q-timeline-entry
                                v-for="visit in item.visits"
                                :key="visit.date"
                                :color="getVisitColor(visit)"
                                :icon="getVisitIcon(visit)"
                                :subtitle="formatSubtitleForGuestVisit(visit)"
                            >
                                <div class="row">
                                    <span id="visit-event-name">
                                        {{ visit.eventName }}
                                    </span>
                                    <q-space />
                                    <ReservationVIPChip v-if="visit.isVIPVisit" />
                                </div>
                            </q-timeline-entry>
                        </q-timeline>
                    </q-tab-panel>
                </FTTabPanels>
            </div>

            <FTCenteredText v-else>{{ t("PageAdminGuest.noVisitsMessage") }}</FTCenteredText>
        </div>
    </div>
</template>
