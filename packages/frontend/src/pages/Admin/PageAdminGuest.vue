<script setup lang="ts">
import type { GuestDoc, Visit } from "@firetable/types";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { deleteGuest, getGuestPath } from "@firetable/backend";
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

interface Props {
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
const props = defineProps<Props>();
const { data: guest } = useFirestoreDocument<GuestDoc>(
    getGuestPath(props.organisationId, props.guestId),
    {
        once: true,
    },
);
const tab = ref("");
const propertiesVisits = computed(function () {
    const visitsByProperty: VisitsByProperty = {};
    for (const [propertyId, events] of Object.entries(guest.value?.visitedProperties ?? {})) {
        const propertyData = properties.value.find(matchesProperty("id", propertyId));
        if (!propertyData) {
            continue;
        }
        visitsByProperty[propertyId] = {
            name: propertyData.name,
            visits: Object.values(events).filter(Boolean) as Visit[],
        };
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

async function editGuest(): Promise<void> {
    if (!(await showConfirm("Are you sure you want to edit this guest?"))) {
        return;
    }

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewGuestForm,
            componentPropsObject: {
                mode: "edit",
                initialData: { ...guest.value },
            },
            maximized: false,
            title: "Edit guest",
            listeners: {
                update() {
                    dialog.hide();
                },
            },
        },
    });
}

async function onDeleteGuest(guestId: string): Promise<void> {
    if (!(await showConfirm(t("PageAdminGuests.deleteGuestConfirmationMessage")))) {
        return;
    }

    return tryCatchLoadingWrapper({
        async hook() {
            await deleteGuest(props.organisationId, guestId);
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
                    <q-btn rounded icon="pencil" color="secondary" @click="editGuest" />
                    <q-btn rounded icon="trash" color="negative" @click="onDeleteGuest(guest.id)" />
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
                                    <span>
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

            <FTCenteredText v-else> There are no visits recorded for this guest.</FTCenteredText>
        </div>
    </div>
</template>
