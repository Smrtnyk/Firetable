<script setup lang="ts">
import { FloorDoc, FloorMode, TableElement } from "src/types/floor";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils"; // NOSONAR
import { useFirestore } from "src/composables/useFirestore";

import { FTTitle } from "components/FTTitle";
import { EventFeedList } from "components/Event/EventFeedList";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "components/admin/event/AdminEventFloorViewer.vue";
import FTDialog from "components/FTDialog.vue";

import { useQuasar } from "quasar";
import { Collection } from "src/types/firebase";
import { EventDoc, EventFeedDoc } from "src/types/event";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { isTable } from "src/floor-manager/type-guards";

interface Props {
    id: string;
}

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

function showEventInfoEditDialog(): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventEditInfo,
            maximized: false,
            componentPropsObject: {
                eventInfo: event.value.info || "",
                eventId: event.value.id,
            },
        },
    });
}

function showFloorEditDialog(floor: FloorDoc): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventFloorViewer,
            componentPropsObject: {
                floor,
                mode: FloorMode.EDITOR,
                eventId: event.value.id,
            },
        },
    });
}

onMounted(init);
</script>

<template>
    <div v-if="event" class="PageAdminEvent">
        <FTTitle :title="event.name">
            <template #right>
                <div class="column">
                    <span class="text-caption">Event date</span>
                    <span>
                        {{ formatEventDate(event.date) }}
                    </span>
                </div>
            </template>
        </FTTitle>
        <q-tabs v-model="tab" dense align="justify" narrow-indicator>
            <q-tab name="info" label="Info" />
            <q-tab name="activity" label="Activity" />
            <q-tab name="edit" label="Edit" />
        </q-tabs>
        <div class="q-gutter-y-md">
            <q-tab-panels v-model="tab" animated>
                <!-- General info with charts area -->
                <q-tab-panel name="info">
                    <AdminEventGeneralInfo :reservations-status="reservationsStatus" />
                    <AdminEventReservationsByPerson :reservations="eventData" />
                </q-tab-panel>

                <!-- Activity area -->
                <q-tab-panel name="activity">
                    <EventFeedList v-if="eventFeed.length" :event-feed="eventFeed" />
                </q-tab-panel>

                <!-- Edit area -->
                <q-tab-panel name="edit">
                    <div class="column justify-between">
                        <q-btn
                            class="button-gradient"
                            size="md"
                            rounded
                            @click="showEventInfoEditDialog"
                        >
                            Event info
                        </q-btn>

                        <q-separator class="q-my-md" />
                        <h2 class="text-subtitle1">Event Floors</h2>
                        <q-btn
                            class="button-gradient"
                            size="md"
                            rounded
                            v-for="floor in eventFloors"
                            :key="floor.id"
                            @click="() => showFloorEditDialog(floor)"
                        >
                            {{ floor.name }}
                        </q-btn>
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
