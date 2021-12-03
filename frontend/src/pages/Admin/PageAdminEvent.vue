<script setup lang="ts">
import { FloorDoc } from "src/types/floor";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";
import { useFirestore } from "src/composables/useFirestore";

import FTTitle from "components/FTTitle.vue";
import EventFeedList from "components/admin/event/EventFeedList.vue";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "components/admin/event/AdminEventFloorViewer.vue";
import FTDialog from "components/FTDialog.vue";

import { useQuasar } from "quasar";
import { Collection } from "src/types/firebase";
import { EventDoc, EventFeedDoc } from "src/types/event";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { config } from "src/config";
import { BaseTable, FloorMode } from "src/floor-manager/types";
import { Floor } from "src/floor-manager/Floor";
import { updateEventFloorData } from "src/services/firebase/db-events";
import { getTablesFromFloorDoc } from "src/floor-manager/filters";

interface Props {
    id: string;
}

const props = defineProps<Props>();
const router = useRouter();
const quasar = useQuasar();
const tab = ref("info");

const { data: eventFloors } = useFirestore<FloorDoc>({
    type: "watch",
    path: `${Collection.EVENTS}/${props.id}/floors`,
});

const { data: event } = useFirestoreDoc<EventDoc>({
    type: "watch",
    path: `${Collection.EVENTS}/${props.id}`,
    onError() {
        router.replace("/").catch(showErrorMessage);
    },
});

const { data: eventFeed } = useFirestore<EventFeedDoc>({
    type: "get",
    path: `${Collection.EVENTS}/${props.id}/${Collection.EVENT_FEED}`,
});

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(eventFinishedLimit.getHours() + config.eventDuration);
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const eventData = computed(() => eventFloors.value.map(getTablesFromFloorDoc).flat());

const reservationsStatus = computed(() => {
    const tables = eventData.value as unknown as BaseTable[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const reservations = tables.filter((table) => !!table.reservation);
    const unreserved = tables.length - reservations.length;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

function onFloorUpdate(floor: Floor) {
    tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id)).catch(showErrorMessage);
}

function showEventInfoEditDialog(): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventEditInfo,
            maximized: false,
            title: "Edit event info",
            componentPropsObject: {
                eventInfo: event.value.info || "",
                eventId: event.value.id,
            },
            listeners: {},
        },
    });
}

function showFloorEditDialog(floor: FloorDoc): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventFloorViewer,
            title: `Editing Floor: ${floor.name}`,
            componentPropsObject: {
                floor,
                mode: FloorMode.EDITOR,
                eventId: event.value.id,
            },
            listeners: {
                update: onFloorUpdate,
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
        <q-tabs
            v-model="tab"
            align="justify"
            switch-indicator
            active-class="button-gradient"
            narrow-indicator
        >
            <q-tab name="info" label="Info" />
            <q-tab name="activity" label="Activity" />
            <q-tab name="edit" label="Edit" v-if="!isEventFinished(event.date)" />
        </q-tabs>
        <div class="q-gutter-y-md">
            <q-tab-panels v-model="tab" animated transition-next="fade" transition-prev="fade">
                <!-- General info with charts area -->
                <q-tab-panel name="info">
                    <AdminEventGeneralInfo :reservations-status="reservationsStatus" />
                    <q-separator class="q-my-sm bg-grey-6" />
                    <AdminEventReservationsByPerson :reservations="eventData" />
                </q-tab-panel>

                <!-- Activity area -->
                <q-tab-panel name="activity">
                    <EventFeedList :event-feed="eventFeed" />
                </q-tab-panel>

                <!-- Edit area -->
                <q-tab-panel name="edit" v-if="!isEventFinished(event.date)">
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
                            class="button-gradient q-mb-sm"
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
