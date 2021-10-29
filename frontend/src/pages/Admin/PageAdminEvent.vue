<template>
    <div v-if="event" class="PageAdminEvent">
        <f-t-title :title="event.name">
            <template #right>
                <div class="column">
                    <span class="text-caption">Event date</span>
                    <span>
                        {{ formatEventDate(event.date) }}
                    </span>
                </div>
            </template>
        </f-t-title>
        <q-tabs v-model="tab" dense align="justify" narrow-indicator>
            <q-tab name="info" label="Info" />
            <q-tab name="activity" label="Activity" />
            <q-tab name="edit" label="Edit" />
        </q-tabs>
        <div class="q-gutter-y-md">
            <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="info">
                    <admin-event-general-info :reservations-status="reservationsStatus" />
                    <admin-event-reservations-by-person :reservations="eventData" />
                </q-tab-panel>

                <q-tab-panel name="activity">
                    <event-feed-list v-if="eventFeed.length" :event-feed="eventFeed" />
                </q-tab-panel>
                <q-tab-panel name="edit">
                    <q-btn @click="() => handleShowComponentInDialog('editEvent')">
                        Edit event info
                    </q-btn>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>

<script setup lang="ts">
import { FloorDoc, TableElement } from "src/types/floor";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils"; // NOSONAR
import { useFirestore } from "src/composables/useFirestore";

import { FTTitle } from "components/FTTitle";
import { EventFeedList } from "components/Event/EventFeedList";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import FTDialog from "components/FTDialog.vue";

import { useQuasar } from "quasar";
import { Collection } from "src/types/firebase";
import { EventDoc, EventFeedDoc } from "src/types/event";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { isTable } from "src/floor-manager/type-guards";

interface Props {
    id: string;
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>();

const router = useRouter();
const quasar = useQuasar();
const tab = ref("info");

const { data: eventFloors } = useFirestore<FloorDoc>({
    type: "watch",
    queryType: "collection",
    path: `${Collection.EVENTS}/${props.id}/floors`,
});

const { data: event } = useFirestore<EventDoc>({
    type: "watch",
    queryType: "doc",
    path: `${Collection.EVENTS}/${props.id}`,
    onError() {
        router.replace("/").catch(showErrorMessage);
    },
});

const { data: eventFeed } = useFirestore<EventFeedDoc>({
    type: "get",
    queryType: "collection",
    path: `${Collection.EVENTS}/${props.id}/${Collection.EVENT_FEED}`,
});

const eventData = computed(() =>
    eventFloors.value
        .map((floor) => floor.data)
        .flat()
        .filter(isTable)
);

const reservationsStatus = computed(() => {
    const tables: TableElement[] = eventData.value;
    const reservations = tables.filter((table) => !!table.reservation);
    const unreserved = tables.length - reservations.length;
    const pending = reservations.filter((table) => !table.reservation?.confirmed).length;
    const confirmed = reservations.length - pending;
    const reserved = reservations.length;

    return {
        total: tables.length,
        reserved,
        pending,
        confirmed,
        unreserved,
    };
});

async function init() {
    if (!props.id) {
        await router.replace("/");
    }
}

function handleShowComponentInDialog(type: string): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventEditInfo,
            componentPropsObject: {
                eventInfo: event.value.info || "",
                eventId: event.value.id,
            },
        },
    });
}

onMounted(init);
</script>
