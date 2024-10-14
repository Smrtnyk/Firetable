<script setup lang="ts">
import type {
    EventDoc,
    FloorDoc,
    GuestInGuestListData,
    PlannedReservationDoc,
    QueuedReservation,
    QueuedReservationDoc,
    ReservationDoc,
} from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import {
    deleteQueuedReservation,
    saveQueuedReservation,
    getEventFloorsPath,
    getEventGuestListPath,
    getEventPath,
    queuedReservationsCollection,
    reservationsCollection,
} from "@firetable/backend";
import { isPlannedReservation, ReservationStatus } from "@firetable/types";
import { Loading } from "quasar";
import { useRouter } from "vue-router";
import { computed, onMounted, onUnmounted, useTemplateRef } from "vue";
import { useEventsStore } from "src/stores/events-store";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorsPageEvent } from "src/composables/useFloorsPageEvent";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { where } from "firebase/firestore";
import { useUsers } from "src/composables/useUsers";

import EventGuestList from "src/components/Event/EventGuestList.vue";
import FTAutocomplete from "src/components/Event/FTAutocomplete.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import FTDialog from "src/components/FTDialog.vue";
import EventQueuedReservations from "src/components/Event/EventQueuedReservations.vue";
import EventViewControls from "src/components/Event/EventViewControls.vue";
import EventFloorCanvasList from "src/components/Event/EventFloorCanvasList.vue";

import { TableOperationType, useReservations } from "src/composables/useReservations";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";

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

const authStore = useAuthStore();
const eventsStore = useEventsStore();
const router = useRouter();
const { t } = useI18n();
const { createDialog } = useDialog();
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");

const { users } = useUsers(eventOwner.organisationId);
const guestList = useFirestoreCollection<GuestInGuestListData>(getEventGuestListPath(eventOwner), {
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
} = useFirestoreCollection<ReservationDoc>(
    createQuery(
        reservationsCollection(eventOwner),
        // For event view, we only need reservations with status ACTIVE
        where("status", "==", ReservationStatus.ACTIVE),
    ),
    { wait: true },
);
const {
    data: queuedResData,
    error: queuedResListenerError,
    promise: queuedResPromise,
} = useFirestoreCollection<QueuedReservationDoc>(
    createQuery(queuedReservationsCollection(eventOwner)),
    { wait: true },
);

const plannedReservations = computed(function () {
    return reservations.value.filter(function (reservation): reservation is PlannedReservationDoc {
        return isPlannedReservation(reservation);
    });
});

const {
    animateTables,
    setActiveFloor,
    isActiveFloor,
    mapFloorToCanvas,
    stopAllTableAnimations,
    hasMultipleFloorPlans,
    activeFloor,
    floorInstances,
} = useFloorsPageEvent(eventFloors, pageRef);

const { initiateTableOperation } = useReservations(
    users,
    reservations,
    floorInstances,
    eventOwner,
    event,
);

function showEventInfo(): void {
    createDialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            title: t("PageEvent.eventInfoTitle"),
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
    await Promise.all([
        eventDataPromise.value,
        reservationsDataPromise.value,
        queuedResPromise.value,
    ]);
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

function navigateToAdminEvent(): void {
    router.push({
        name: "adminEvent",
        params: {
            organisationId: eventOwner.organisationId,
            propertyId: eventOwner.propertyId,
        },
    });
}

function onReservationUnqueue(reservation: QueuedReservationDoc): void {
    initiateTableOperation({
        type: TableOperationType.RESERVATION_DEQUEUE,
        reservation,
    });
}

async function onCreateQueuedReservation(reservation: QueuedReservation): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return saveQueuedReservation(eventOwner, reservation);
        },
    });
}

async function onDeleteQueuedReservation(reservation: QueuedReservationDoc): Promise<void> {
    const shouldDelete = await showConfirm(t("PageEvent.deleteQueuedReservationConfirmMsg"));

    if (!shouldDelete) {
        return;
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteQueuedReservation(eventOwner, reservation.id);
        },
    });
}

onMounted(init);

onUnmounted(function () {
    eventsStore.setCurrentEventName("");
});
</script>

<template>
    <div v-if="event" class="PageEvent flex column justify-between" ref="pageRef">
        <div>
            <FTAutocomplete
                :floors="eventFloors"
                :show-floor-name-in-option="hasMultipleFloorPlans"
                :all-reserved-tables="plannedReservations"
                @found="animateTables"
                @clear="stopAllTableAnimations"
                class="q-mb-sm"
            />

            <EventViewControls
                :active-floor="activeFloor"
                :floors="floorInstances"
                :has-multiple-floor-plans="hasMultipleFloorPlans"
                :is-admin="authStore.isAdmin"
                :is-active-floor="isActiveFloor"
                @navigate-to-admin-event="navigateToAdminEvent"
                @toggle-event-guest-list-drawer-visibility="
                    eventsStore.toggleEventGuestListDrawerVisibility
                "
                @toggle-queued-reservations-drawer-visibility="
                    eventsStore.toggleQueuedReservationsDrawerVisibility
                "
                @show-event-info="showEventInfo"
                @set-active-floor="setActiveFloor"
            />
        </div>

        <EventFloorCanvasList
            v-if="eventFloors.length > 0"
            :event-floors="eventFloors"
            :map-floor-to-canvas="mapFloorToCanvas"
            :is-active-floor="isActiveFloor"
            @set-active-floor="setActiveFloor"
        />

        <EventQueuedReservations
            v-if="event"
            :data="queuedResData"
            :error="queuedResListenerError"
            :event-owner="eventOwner"
            :users="users"
            :event-data="event"
            @unqueue="onReservationUnqueue"
            @create="onCreateQueuedReservation"
            @delete="onDeleteQueuedReservation"
        />
        <EventGuestList
            :guest-list-limit="event.guestListLimit"
            :guest-list="guestList"
            :event-owner="eventOwner"
        />
    </div>
</template>
