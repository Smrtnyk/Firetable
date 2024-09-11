<script setup lang="ts">
import type { GuestDoc, Visit } from "@firetable/types";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { getGuestPath } from "@firetable/backend";
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

const { properties } = storeToRefs(usePropertiesStore());
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
</script>

<template>
    <div class="PageAdminGuest">
        <div v-if="guest?.name">
            <FTTitle :title="guest.name" />

            <FTCenteredText> Contact: {{ guest.contact }} </FTCenteredText>

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
    </div>
</template>
