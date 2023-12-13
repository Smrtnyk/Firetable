<script setup lang="ts">
import type { EventDoc, FloorDoc, GuestData, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { TouchPanValue } from "quasar";
import EventGuestList from "src/components/Event/EventGuestList.vue";
import FTAutocomplete from "src/components/Event/FTAutocomplete.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import FTDialog from "src/components/FTDialog.vue";

import { Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { computed, onMounted, ref, onUnmounted } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useFirestoreCollection, useFirestoreDocument } from "src/composables/useFirestore";
import { useFloorsPageEvent } from "src/composables/useFloorsPageEvent";
import {
    getEventFloorsPath,
    getEventGuestListPath,
    getEventPath,
    getReservationsPath,
} from "@firetable/backend";
import { isMobile } from "src/global-reactives/screen-detection";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";

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
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const router = useRouter();
const q = useQuasar();
const pageRef = ref<HTMLDivElement>();

const guestList = useFirestoreCollection<GuestData>(getEventGuestListPath(eventOwner), {
    wait: true,
});
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    getEventPath(eventOwner),
);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner));
const {
    data: reservations,
    promise: reservationsDataPromise,
    error: reservationsDataError,
} = useFirestoreCollection<ReservationDoc>(getReservationsPath(eventOwner), { wait: true });

const fabPos = ref([18, 18]);
const draggingFab = ref(false);

const {
    onTableFound,
    setActiveFloor,
    isActiveFloor,
    mapFloorToCanvas,
    onAutocompleteClear,
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
    await Promise.all([eventDataPromise.value, reservationsDataPromise.value]);
    Loading.hide();

    if (reservationsDataError.value) {
        showErrorMessage(reservationsDataError);
        await router.replace("/");
        return;
    }
    eventsStore.setCurrentEventName(event.value?.name || "");
}

const moveFab: TouchPanValue = (ev) => {
    draggingFab.value = !ev.isFirst && ev.isFinal !== true;

    fabPos.value = [fabPos.value[0] - (ev.delta?.x ?? 0), fabPos.value[1] - (ev.delta?.y ?? 0)];
};

onMounted(init);

onUnmounted(() => {
    eventsStore.setCurrentEventName("");
});
</script>

<template>
    <div v-if="event" class="PageEvent flex column justify-between" ref="pageRef">
        <q-page-sticky
            v-if="authStore.isAdmin"
            position="bottom-right"
            :offset="fabPos"
            style="z-index: 999999"
        >
            <q-fab
                icon="chevron_left"
                direction="left"
                vertical-actions-align="center"
                color="primary"
                :disable="draggingFab"
                v-touch-pan.prevent.mouse="moveFab"
                padding="sm"
            >
                <q-fab-action
                    :to="{
                        name: 'adminEvent',
                        params: {
                            organisationId: eventOwner.organisationId,
                            propertyId: eventOwner.propertyId,
                            eventId: eventOwner.id,
                        },
                    }"
                    color="primary"
                    label="View in manager"
                    :disable="draggingFab"
                />
            </q-fab>
        </q-page-sticky>

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
                class="button-gradient q-ma-none q-ml-sm"
                round
                :size="buttonSize"
                icon="info"
                @click="showEventInfo"
                v-if="event.info"
            />
            <q-btn
                v-if="!isMobile"
                class="button-gradient q-ma-none q-ml-sm"
                @click="eventsStore.toggleEventGuestListDrawerVisibility"
                icon="users"
                rounded
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
