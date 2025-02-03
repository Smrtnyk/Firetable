<script setup lang="ts">
import type { EventOwner } from "@firetable/backend";
import type {
    EventDoc,
    EventFloorDoc,
    GuestInGuestListData,
    PlannedReservationDoc,
    QueuedReservation,
    QueuedReservationDoc,
    ReservationDoc,
} from "@firetable/types";

import {
    deleteQueuedReservation,
    fetchUsersByRole,
    getEventFloorsPath,
    getEventGuestListPath,
    getEventPath,
    queuedReservationsCollection,
    reservationsCollection,
    saveQueuedReservation,
} from "@firetable/backend";
import { isPlannedReservation, ReservationStatus } from "@firetable/types";
import { useAsyncState } from "@vueuse/core";
import { where } from "firebase/firestore";
import { Loading } from "quasar";
import EventFloorCanvasList from "src/components/Event/EventFloorCanvasList.vue";
import EventGuestList from "src/components/Event/EventGuestList.vue";
import EventGuestSearch from "src/components/Event/EventGuestSearch.vue";
import EventInfo from "src/components/Event/EventInfo.vue";
import EventQueuedReservations from "src/components/Event/EventQueuedReservations.vue";
import EventViewControls from "src/components/Event/EventViewControls.vue";
import FTDialog from "src/components/FTDialog.vue";
import { useReservations } from "src/composables/reservations/useReservations";
import { TableOperationType } from "src/composables/reservations/useTableOperations";
import { useDialog } from "src/composables/useDialog";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorsPageEvent } from "src/composables/useFloorsPageEvent";
import { useGuestsForEvent } from "src/composables/useGuestsForEvent";
import { exportReservations } from "src/helpers/reservation/export-reservations";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useEventsStore } from "src/stores/events-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { computed, onMounted, onUnmounted, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    eventId: string;
    organisationId: string;
    propertyId: string;
}

const { eventId, organisationId, propertyId } = defineProps<Props>();

const eventOwner: EventOwner = {
    id: eventId,
    organisationId,
    propertyId,
};

const permissionStore = usePermissionsStore();
const eventsStore = useEventsStore();
const router = useRouter();
const { t } = useI18n();
const { createDialog } = useDialog();
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");

const { execute: loadUsersPromise, state: users } = useAsyncState(
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
    error: reservationsDataError,
    promise: reservationsDataPromise,
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
    activeFloor,
    animateTables,
    floorInstances,
    hasMultipleFloorPlans,
    isActiveFloor,
    mapFloorToCanvas,
    setActiveFloor,
    stopAllTableAnimations,
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
        eventName: event.value.name,
        floors: eventFloors.value,
        reservations: reservations.value,
    });
}

function onReservationUnqueue(reservation: QueuedReservationDoc): void {
    initiateTableOperation({
        reservation,
        type: TableOperationType.RESERVATION_DEQUEUE,
    });
}

function showEventInfo(): void {
    if (!event.value) {
        return;
    }
    createDialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            componentPropsObject: {
                activeReservations: reservations.value,
                eventInfo: event.value.info,
                floors: eventFloors.value,
                returningGuests: returningGuests.value,
            },
            listeners: {},
            maximized: false,
            title: event.value.name,
        },
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
