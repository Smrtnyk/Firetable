<script setup lang="ts">
import type {
    EventDoc,
    FloorDoc,
    GuestInGuestListData,
    PlannedReservationDoc,
    ReservationDoc,
} from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { TouchPanValue } from "quasar";
import { isPlannedReservation, ReservationStatus } from "@firetable/types";
import {
    reservationsCollection,
    getEventFloorsPath,
    getEventGuestListPath,
    getEventPath,
} from "@firetable/backend";
import { Loading, useQuasar } from "quasar";
import EventGuestList from "src/components/Event/EventGuestList.vue";
import FTAutocomplete from "src/components/Event/FTAutocomplete.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import FTDialog from "src/components/FTDialog.vue";

import { useRouter } from "vue-router";
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useEventsStore } from "src/stores/events-store";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorsPageEvent } from "src/composables/useFloorsPageEvent";
import { isMobile } from "src/global-reactives/screen-detection";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { where } from "firebase/firestore";

interface Props {
    organisationId: string;
    propertyId: string;
    eventId: string;
}

const { propertyId, eventId, organisationId } = defineProps<Props>();

const eventOwner: EventOwner = {
    propertyId,
    organisationId,
    id: eventId,
};

const showMapsExpanded = ref(false);
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const router = useRouter();
const quasar = useQuasar();
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");

const guestList = useFirestoreCollection<GuestInGuestListData>(getEventGuestListPath(eventOwner), {
    wait: true,
});
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    getEventPath(eventOwner),
);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner));
// For event view, we only need reservations with status ACTIVE
const {
    data: reservations,
    promise: reservationsDataPromise,
    error: reservationsDataError,
} = useFirestoreCollection<ReservationDoc>(
    createQuery(
        reservationsCollection(eventOwner),
        where("status", "==", ReservationStatus.ACTIVE),
    ),
    { wait: true },
);

const plannedReservations = computed(function () {
    return reservations.value.filter(function (reservation): reservation is PlannedReservationDoc {
        return isPlannedReservation(reservation);
    });
});
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

const buttonSize = computed(function () {
    return isMobile.value ? "sm" : "md";
});

function showEventInfo(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            title: "Event Info",
            maximized: false,
            componentPropsObject: {
                eventInfo: event.value?.info ?? "",
            },
            listeners: {},
        },
    });
}

async function init(): Promise<void> {
    Loading.show();
    await Promise.all([eventDataPromise.value, reservationsDataPromise.value]);
    Loading.hide();

    if (!event.value) {
        showErrorMessage("Event not found", function () {
            router.replace("/");
        });
        return;
    }

    if (reservationsDataError.value) {
        showErrorMessage(reservationsDataError, function () {
            router.replace("/");
        });
        return;
    }

    eventsStore.setCurrentEventName(event.value?.name ?? "");
}

function moveFab(ev: Parameters<NonNullable<TouchPanValue>>[0]): void {
    draggingFab.value = !ev.isFirst && ev.isFinal !== true;

    fabPos.value = [fabPos.value[0] - (ev.delta?.x ?? 0), fabPos.value[1] - (ev.delta?.y ?? 0)];
}

onMounted(init);

onUnmounted(function () {
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

        <q-page-sticky
            v-if="hasMultipleFloorPlans"
            position="bottom-left"
            :offset="[18, 18]"
            style="z-index: 999999"
        >
            <q-fab
                :model-value="showMapsExpanded"
                :label="!isMobile && activeFloor ? activeFloor.name : ''"
                padding="xs"
                vertical-actions-align="left"
                icon="chevron_right"
                direction="up"
                color="primary"
            >
                <q-fab-action
                    :key="florInstance.id"
                    v-for="florInstance of floorInstances"
                    class="text-white"
                    :class="{
                        'button-gradient': isActiveFloor(florInstance.id),
                        'bg-primary': !isActiveFloor(florInstance.id),
                    }"
                    @click.prevent="() => setActiveFloor(florInstance)"
                    :label="florInstance.name"
                />
            </q-fab>
        </q-page-sticky>

        <div class="row items-center q-mb-sm q-gutter-sm">
            <FTAutocomplete
                :floors="eventFloors"
                :show-floor-name-in-option="hasMultipleFloorPlans"
                :all-reserved-tables="plannedReservations"
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
            <div class="ft-card ft-border ft-no-border-radius">
                <canvas :id="floor.id" :ref="mapFloorToCanvas(floor)"></canvas>
            </div>
        </div>

        <EventGuestList
            :guest-list-limit="event.guestListLimit"
            :guest-list="guestList"
            :event-owner="eventOwner"
        />
    </div>
</template>
