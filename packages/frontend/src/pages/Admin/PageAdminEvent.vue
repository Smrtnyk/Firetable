<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";

import FTTitle from "components/FTTitle.vue";
import EventFeedList from "components/admin/event/EventFeedList.vue";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "components/admin/event/AdminEventFloorViewer.vue";
import AdminEventActiveStaff from "components/admin/event/AdminEventActiveStaff.vue";
import FTDialog from "components/FTDialog.vue";

import { useQuasar } from "quasar";
import { config } from "src/config";
import { BaseTable, Floor, FloorMode, getTablesFromFloorDoc } from "@firetable/floor-creator";
import { Collection, EventDoc, EventFeedDoc, FloorDoc, Role, User } from "@firetable/types";
import { updateEventFloorData, updateEventProperty } from "@firetable/backend";
import { where } from "firebase/firestore";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { propIsTruthy } from "@firetable/utils";

interface Props {
    id: string;
}

const props = defineProps<Props>();
const router = useRouter();
const quasar = useQuasar();
const tab = ref("info");

const { data: eventFloors } = useFirestoreCollection<FloorDoc>(
    `${Collection.EVENTS}/${props.id}/floors`,
);

const users = useFirestoreCollection<User>(
    createQuery(getFirestoreCollection(Collection.USERS), where("role", "!=", Role.ADMIN)),
    { once: true },
);

const {
    data: event,
    error: eventError,
    stop: stopEventWatch,
} = useFirestoreDocument<EventDoc>(`${Collection.EVENTS}/${props.id}`);

watch(eventError, () => {
    if (eventError.value) {
        router.replace("/").catch(showErrorMessage);
        stopEventWatch();
    }
});

const { data: eventFeed } = useFirestoreCollection<EventFeedDoc>(
    `${Collection.EVENTS}/${props.id}/${Collection.EVENT_FEED}`,
);

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(eventFinishedLimit.getHours() + config.eventDuration);
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

const eventData = computed(() => eventFloors.value.map(getTablesFromFloorDoc).flat());

const reservationsStatus = computed(() => {
    const tables = eventData.value as unknown as BaseTable[];
    const reservations = tables.filter(propIsTruthy("reservation"));
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

function onFloorUpdate(floor: Floor) {
    tryCatchLoadingWrapper({
        hook: () => updateEventFloorData(floor, props.id),
    });
}

function onUpdateActiveStaff(newActiveStaff: User["id"][]) {
    if (!event.value) return;
    const eventId = event.value.id;
    tryCatchLoadingWrapper({
        hook: () => updateEventProperty(eventId, "activeStaff", newActiveStaff),
    });
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

function showAssignStaffDialog(): void {
    if (!event.value) return;
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: AdminEventActiveStaff,
            title: `Active Staff`,
            componentPropsObject: {
                eventId: event.value.id,
                users: users.value,
                activeStaff: new Set(event.value.activeStaff || []),
            },
            listeners: {
                updateActiveStaff: onUpdateActiveStaff,
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

                        <!-- Staff assigned to an event -->
                        <q-separator class="q-my-md" />
                        <h2 class="text-subtitle1">Active Staff</h2>
                        <q-btn
                            class="button-gradient q-mb-sm"
                            size="md"
                            rounded
                            @click="showAssignStaffDialog"
                        >
                            Assign active staff
                        </q-btn>
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
