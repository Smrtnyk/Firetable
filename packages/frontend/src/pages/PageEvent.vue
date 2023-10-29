<script setup lang="ts">
import EventGuestList from "components/Event/EventGuestList.vue";
import FTAutocomplete from "components/Event/FTAutocomplete.vue";
import EventInfo from "components/Event/EventInfo.vue";
import FTDialog from "components/FTDialog.vue";

import { Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { onMounted, reactive, ref } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useFirestoreCollection, useFirestoreDocument } from "src/composables/useFirestore";
import { Collection, EventDoc, FloorDoc, GuestData } from "@firetable/types";
import useFloorsPageEvent from "src/composables/useFloorsPageEvent";
import { EventOwner } from "@firetable/backend";

interface State {
    showMapsExpanded: boolean;
}

interface Props {
    organisationId: string;
    propertyId: string;
    eventId: string;
}

const props = defineProps<Props>();

const eventDocPath = [
    Collection.ORGANISATIONS,
    props.organisationId,
    Collection.PROPERTIES,
    props.propertyId,
    Collection.EVENTS,
    props.eventId,
].join("/");
const eventFloorsPath = [
    Collection.ORGANISATIONS,
    props.organisationId,
    Collection.PROPERTIES,
    props.propertyId,
    Collection.EVENTS,
    props.eventId,
    Collection.FLOORS,
].join("/");
const guestListPath = [
    Collection.ORGANISATIONS,
    props.organisationId,
    Collection.PROPERTIES,
    props.propertyId,
    Collection.EVENTS,
    props.eventId,
    Collection.GUEST_LIST,
].join("/");

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: props.eventId,
};

const state = reactive<State>({
    showMapsExpanded: false,
});
const eventsStore = useEventsStore();
const router = useRouter();
const q = useQuasar();
const pageRef = ref<HTMLDivElement>();
const guestList = useFirestoreCollection<GuestData>(guestListPath);
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(eventDocPath);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(eventFloorsPath);
const {
    onTableFound,
    setActiveFloor,
    isActiveFloor,
    mapFloorToCanvas,
    onAutocompleteClear,
    allReservedTables,
    useFloorsPageEventState,
} = useFloorsPageEvent(eventFloors, pageRef, eventOwner, event);

function showActiveStaff(): void {
    // todo: implement
}

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

async function init() {
    if (!props.eventId) {
        await router.replace("/");
    }
    Loading.show();
    await eventDataPromise.value;
    Loading.hide();
}

onMounted(init);
</script>

<template>
    <div v-if="event" class="PageEvent" ref="pageRef">
        <div class="row items-center q-mb-sm">
            <q-fab
                v-if="useFloorsPageEventState.floorInstances.size"
                :model-value="state.showMapsExpanded"
                :label="
                    useFloorsPageEventState.activeFloor
                        ? useFloorsPageEventState.activeFloor.name
                        : ''
                "
                padding="xs"
                vertical-actions-align="left"
                icon="chevron_down"
                direction="down"
                class="button-gradient"
            >
                <q-fab-action
                    :key="florInstance.id"
                    v-for="florInstance of useFloorsPageEventState.floorInstances"
                    class="text-white"
                    :class="{ 'button-gradient': isActiveFloor(florInstance.id) }"
                    @click.prevent="() => setActiveFloor(florInstance)"
                    :label="florInstance.name"
                />
            </q-fab>

            <q-space />
            <q-btn
                class="button-gradient q-mr-sm"
                rounded
                size="md"
                icon="check"
                @click="showActiveStaff"
                v-if="event.activeStaff"
            />
            <q-btn
                class="button-gradient q-mr-sm"
                rounded
                size="md"
                icon="info"
                @click="showEventInfo"
                v-if="event.info"
            />
            <q-btn
                class="button-gradient"
                @click="eventsStore.toggleEventGuestListDrawerVisibility"
                icon="users"
                rounded
                size="md"
            />
        </div>
        <q-separator class="q-mx-auto q-my-xs-xs q-my-sm-sm q-my-md-md" inset />
        <FTAutocomplete
            :all-reserved-tables="allReservedTables"
            @found="onTableFound"
            @clear="onAutocompleteClear"
            class="q-mb-sm"
        />

        <div
            v-for="floor in eventFloors"
            :key="floor.id"
            class="ft-tab-pane"
            :class="{ 'active show': isActiveFloor(floor.id) }"
        >
            <canvas :id="floor.id" class="shadow-3" :ref="mapFloorToCanvas(floor)"></canvas>
        </div>

        <EventGuestList
            :guest-list-limit="event.guestListLimit"
            :guest-list="guestList"
            :event-owner="eventOwner"
        />
    </div>
</template>
