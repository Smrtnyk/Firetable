<script setup lang="ts">
import type { GuestDoc, Visit } from "@firetable/types";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { getGuestPath } from "@firetable/backend";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/usePropertiesStore";

import FTTitle from "src/components/FTTitle.vue";
import FTTabs from "src/components/FTTabs.vue";
import { formatEventDate } from "src/helpers/date-utils";

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
const propertiesVisits = computed(() => {
    const visitsByProperty: VisitsByProperty = {};
    for (const [propertyId, events] of Object.entries(guest.value?.visitedProperties || {})) {
        const propertyData = properties.value.find(function ({ id }) {
            return id === propertyId;
        });
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
    (newVisits) => {
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
            <FTTabs v-model="tab">
                <q-tab
                    v-for="(item, propertyId) in propertiesVisits"
                    :key="propertyId"
                    :name="propertyId"
                    :label="item.name"
                />
            </FTTabs>
            <q-tab-panels v-model="tab">
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
                            <div>
                                {{ visit.eventName }}
                            </div>
                        </q-timeline-entry>
                    </q-timeline>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
