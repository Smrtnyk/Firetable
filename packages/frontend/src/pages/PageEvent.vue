<script setup lang="ts">
import EventGuestList from "src/components/Event/EventGuestList.vue";
import FTAutocomplete from "src/components/Event/FTAutocomplete.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import FTDialog from "src/components/FTDialog.vue";

import { Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useFirestoreCollection, useFirestoreDocument } from "src/composables/useFirestore";
import { EventDoc, FloorDoc, GuestData, ReservationDoc } from "@firetable/types";
import { useFloorsPageEvent } from "src/composables/useFloorsPageEvent";
import {
    EventOwner,
    getEventFloorsPath,
    getEventGuestListPath,
    getEventPath,
    getReservationsPath,
} from "@firetable/backend";
import { isMobile, isTablet } from "src/global-reactives/screen-detection";
import { NOOP } from "@firetable/utils";

interface Props {
    organisationId: string;
    propertyId: string;
    eventId: string;
}

const props = defineProps<Props>();

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: props.eventId,
};

const showMapsExpanded = ref(false);
const eventsStore = useEventsStore();
const router = useRouter();
const q = useQuasar();
const pageRef = ref<HTMLDivElement>();

const guestList = useFirestoreCollection<GuestData>(getEventGuestListPath(eventOwner));
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    getEventPath(eventOwner),
);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner));
const { data: reservations, promise: reservationsDataPromise } =
    useFirestoreCollection<ReservationDoc>(getReservationsPath(eventOwner));

const {
    onTableFound,
    setActiveFloor,
    isActiveFloor,
    mapFloorToCanvas,
    onAutocompleteClear,
    resizeFloor,
    hasMultipleFloorPlans,
    activeFloor,
    floorInstances,
} = useFloorsPageEvent(eventFloors, reservations, pageRef, eventOwner, event);

const buttonSize = computed(() => {
    return isMobile.value ? "sm" : "md";
});

function showEventInfo(): void {
    q.dialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            title: "Event Info",
            maximized: false,
            componentPropsObject: {
                eventInfo: event.value?.info || "",
            },
            listeners: {},
        },
    });
}

async function init(): Promise<void> {
    if (!props.eventId) {
        await router.replace("/");
    }
    Loading.show();
    await eventDataPromise.value;
    await reservationsDataPromise.value;
    Loading.hide();
}

function toggleFullScreen(): void {
    q.fullscreen.toggle(pageRef.value).then(resizeFloor).catch(NOOP);
}

onMounted(init);
</script>

<template>
    <div v-if="event" class="PageEvent flex column justify-between" ref="pageRef">
        <div class="row items-center q-mb-sm q-gutter-sm">
            <q-fab
                v-if="hasMultipleFloorPlans"
                :model-value="showMapsExpanded"
                :label="!isMobile && activeFloor ? activeFloor.name : ''"
                padding="xs"
                vertical-actions-align="left"
                icon="chevron_down"
                direction="down"
                class="button-gradient q-mt-none"
            >
                <q-fab-action
                    :key="florInstance.id"
                    v-for="florInstance of floorInstances"
                    class="text-white"
                    :class="{ 'button-gradient': isActiveFloor(florInstance.id) }"
                    @click.prevent="() => setActiveFloor(florInstance)"
                    :label="florInstance.name"
                />
            </q-fab>

            <FTAutocomplete
                :floors="eventFloors"
                :show-floor-name-in-option="hasMultipleFloorPlans"
                :all-reserved-tables="reservations"
                @found="onTableFound"
                @clear="onAutocompleteClear"
                class="col q-mb-sm"
            />
            <q-btn
                v-if="isTablet"
                class="button-gradient q-ma-none q-ml-sm"
                round
                icon="full-screen"
                @click="toggleFullScreen"
            />
            <q-btn
                class="button-gradient q-ma-none q-ml-sm"
                round
                :size="buttonSize"
                icon="info"
                @click="showEventInfo"
                v-if="event.info"
            />
            <q-btn
                class="button-gradient q-ma-none q-ml-sm"
                @click="eventsStore.toggleEventGuestListDrawerVisibility"
                icon="users"
                round
            />
        </div>

        <div
            v-for="floor in eventFloors"
            :key="floor.id"
            class="ft-tab-pane"
            :class="{ 'active show': isActiveFloor(floor.id) }"
        >
            <q-card>
                <canvas :id="floor.id" :ref="mapFloorToCanvas(floor)"></canvas>
            </q-card>
        </div>

        <EventGuestList
            :guest-list-limit="event.guestListLimit"
            :guest-list="guestList"
            :event-owner="eventOwner"
        />
    </div>
</template>
