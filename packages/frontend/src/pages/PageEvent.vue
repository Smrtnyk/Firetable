<script setup lang="ts">
import type {
    EventDoc,
    EventFloorDoc,
    GuestInGuestListData,
    PlannedReservationDoc,
    QueuedReservation,
    QueuedReservationDoc,
    ReservationDoc,
} from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import {
    fetchUsersByRole,
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
import { where } from "firebase/firestore";

import EventGuestList from "src/components/Event/EventGuestList.vue";
import EventGuestSearch from "src/components/Event/EventGuestSearch.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import FTDialog from "src/components/FTDialog.vue";
import EventQueuedReservations from "src/components/Event/EventQueuedReservations.vue";
import EventViewControls from "src/components/Event/EventViewControls.vue";
import EventFloorCanvasList from "src/components/Event/EventFloorCanvasList.vue";

import { useReservations } from "src/composables/reservations/useReservations";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import { usePermissionsStore } from "src/stores/permissions-store";
import { exportReservations } from "src/helpers/reservation/export-reservations";
import { useGuestsForEvent } from "src/composables/useGuestsForEvent";
import { useAsyncState } from "@vueuse/core";
import { TableOperationType } from "src/composables/reservations/useTableOperations";

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

const permissionStore = usePermissionsStore();
const eventsStore = useEventsStore();
const router = useRouter();
const { t } = useI18n();
const { createDialog } = useDialog();
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");

const { state: users, execute: loadUsersPromise } = useAsyncState(
    () => fetchUsersByRole(organisationId),
    [],
);

const filteredUsersPerProperty = computed(function () {
    return users.value.filter(function (user) {
        return user.relatedProperties.includes(eventOwner.propertyId);
    });
});
const guestList = useFirestoreCollection<GuestInGuestListData>(getEventGuestListPath(eventOwner), {
    wait: true,
});
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    getEventPath(eventOwner),
);
const { data: eventFloors } = useFirestoreCollection<EventFloorDoc>(
    createQuery(getEventFloorsPath(eventOwner)),
);
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
const { returningGuests } = useGuestsForEvent(eventOwner, plannedReservations);

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
    filteredUsersPerProperty,
    reservations,
    floorInstances,
    eventOwner,
    event,
);

const canExportReservations = computed(function () {
    return permissionStore.canExportReservations;
});

function showEventInfo(): void {
    if (!event.value) {
        return;
    }
    createDialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            title: event.value.name,
            maximized: false,
            componentPropsObject: {
                eventInfo: event.value.info,
                floors: eventFloors.value,
                activeReservations: reservations.value,
                returningGuests: returningGuests.value,
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
        loadUsersPromise(),
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

async function onExportReservations(): Promise<void> {
    if (!event.value) {
        return;
    }
    const confirmed = await showConfirm(t("PageEvent.exportReservationsConfirmMsg"));

    if (!confirmed) {
        return;
    }

    exportReservations({
        reservations: reservations.value,
        eventName: event.value.name,
        floors: eventFloors.value,
    });
}

onMounted(init);

onUnmounted(function () {
    eventsStore.setCurrentEventName("");
    eventsStore.toggleEventGuestListDrawerVisibility(false);
    eventsStore.toggleQueuedReservationsDrawerVisibility(false);
});
</script>

<template>
    <div v-if="event" class="PageEvent flex column justify-between" ref="pageRef">
        <div>
            <EventGuestSearch
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
                :can-see-admin-event="permissionStore.canCreateEvents"
                :can-export-reservations="canExportReservations"
                :is-active-floor="isActiveFloor"
                :queued-reservations-count="queuedResData.length"
                :guest-list-count="guestList.length"
                @navigate-to-admin-event="navigateToAdminEvent"
                @toggle-event-guest-list-drawer-visibility="
                    eventsStore.toggleEventGuestListDrawerVisibility
                "
                @toggle-queued-reservations-drawer-visibility="
                    eventsStore.toggleQueuedReservationsDrawerVisibility
                "
                @show-event-info="showEventInfo"
                @set-active-floor="setActiveFloor"
                @export-reservations="onExportReservations"
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
            :users="filteredUsersPerProperty"
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
