<script setup lang="ts">
import type { EventOwner } from "@firetable/backend";
import type { FloorEditor } from "@firetable/floor-creator";
import type { AnyFunction, FloorDoc, ReservationDoc } from "@firetable/types";
import type { Component } from "vue";

import {
    addEventFloor,
    deleteEventFloor,
    deleteReservation,
    updateEventFloorData,
    updateEventFloorsOrder,
} from "@firetable/backend";
import { isActiveReservation } from "@firetable/types";
import { useLocalStorage } from "@vueuse/core";
import { matchesProperty } from "es-toolkit/compat";
import { Loading } from "quasar";
import AdminEventEditInfo from "src/components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorManager from "src/components/admin/event/AdminEventFloorManager.vue";
import AdminEventFloorViewer from "src/components/admin/event/AdminEventFloorViewer.vue";
import AdminEventLogs from "src/components/admin/event/AdminEventLogs.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventReservationsList from "src/components/admin/event/AdminEventReservationsList.vue";
import AdminEventReturningGuestsList from "src/components/admin/event/AdminEventReturningGuestsList.vue";
import AdminEventRTInfo from "src/components/admin/event/AdminEventRTInfo.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useAdminEvent } from "src/composables/useAdminEvent";
import { useDialog } from "src/composables/useDialog";
import { useFloors } from "src/composables/useFloors";
import { useGuestsForEvent } from "src/composables/useGuestsForEvent";
import { isMobile } from "src/global-reactives/screen-detection";
import { compressFloorDoc } from "src/helpers/compress-floor-doc";
import { formatEventDate } from "src/helpers/date-utils";
import { truncateText } from "src/helpers/string-utils";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    eventId: string;
    organisationId: string;
    propertyId: string;
}

const PERMANENTLY_DELETE_RES_TITLE = "Permanently delete reservation?";
const PERMANENTLY_DELETE_RES_MESSAGE =
    "This will delete the reservation permanently, excluding it from all analytics. This cannot be undone.";

const props = defineProps<Props>();
const router = useRouter();
const { locale } = useI18n();
const { createDialog } = useDialog();
const propertiesStore = usePropertiesStore();

const tab = useLocalStorage<string>("admin-event-active-tab", "info");
const reservationsTab = useLocalStorage("admin-event-guests-active-tab", "arrivedReservations");

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(props.propertyId);
});
const subscriptionSettings = computed(function () {
    return propertiesStore.getOrganisationSubscriptionSettingsById(props.organisationId);
});

const eventOwner: EventOwner = {
    id: props.eventId,
    organisationId: props.organisationId,
    propertyId: props.propertyId,
};

const authStore = useAuthStore();
const {
    allPlannedReservations,
    allReservations,
    arrivedReservations,
    cancelledReservations,
    event,
    eventFloors,
    isLoading,
    logs,
} = useAdminEvent(eventOwner);
const { returningGuests } = useGuestsForEvent(eventOwner, allReservations);
const logsLabelWithCount = computed(function () {
    const logsLength = logs.value?.logs.length ?? 0;
    return logsLength > 0 ? `Logs (${logsLength})` : "Logs";
});
const { floors } = useFloors(eventOwner.propertyId, eventOwner.organisationId);

watch(
    isLoading,
    function (newIsLoading) {
        if (newIsLoading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

onUnmounted(function () {
    if (Loading.isActive) {
        Loading.hide();
    }
});

async function addFloor(floor: FloorDoc): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return addEventFloor(eventOwner, floor);
        },
    });
}

async function deleteReservationPermanently(reservation: ReservationDoc): Promise<void> {
    const shouldDeletePermanently = await showConfirm(
        PERMANENTLY_DELETE_RES_TITLE,
        PERMANENTLY_DELETE_RES_MESSAGE,
    );
    if (!shouldDeletePermanently) {
        return;
    }
    await tryCatchLoadingWrapper({
        hook() {
            return deleteReservation(eventOwner, reservation);
        },
    });
}

async function handleFloorReorder(reorderedFloors: FloorDoc[]): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return updateEventFloorsOrder(eventOwner, reorderedFloors);
        },
    });
}

async function init(): Promise<void> {
    if (!props.eventId || !props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
}

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(
        eventFinishedLimit.getHours() + propertySettings.value.event.eventDurationInHours,
    );
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

async function removeFloor(index: number): Promise<void> {
    const floor = eventFloors.value[index];
    // Check if floor has reservations
    if (allReservations.value.some(matchesProperty("floorId", floor.id))) {
        showErrorMessage("Cannot remove floor with active reservations");
        return;
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteEventFloor(eventOwner, floor.id);
        },
    });
}

async function saveFloor(floor: FloorEditor): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const { id } = floor;
            const { height, json, width } = floor.export();
            await updateEventFloorData(eventOwner, {
                height,
                id,
                json: compressFloorDoc(json),
                width,
            });
            floor.markAsSaved();
        },
    });
}

function showDialog(
    component: Component,
    title: string,
    componentPropsObject: Record<string, unknown> = {},
    listeners: Record<string, AnyFunction> = {},
    maximized = isMobile.value,
): void {
    createDialog({
        component: FTDialog,
        componentProps: {
            component,
            componentPropsObject,
            listeners,
            maximized,
            title,
        },
    });
}

function showEventInfoEditDialog(): void {
    if (event.value) {
        showDialog(AdminEventEditInfo, "Edit event info", {
            eventInfo: event.value.info ?? "",
            eventOwner,
        });
    }
}

function showFloorEditDialog(floor: FloorDoc): void {
    if (event.value) {
        showDialog(
            AdminEventFloorViewer,
            `Editing Floor: ${floor.name}`,
            { eventId: event.value.id, floor },
            { save: saveFloor },
            true,
        );
    }
}

onMounted(init);
</script>

<template>
    <div v-if="event && !isLoading" class="PageAdminEvent">
        <FTTitle
            :title="event.name"
            :subtitle="formatEventDate(event.date, locale, propertySettings.timezone)"
        >
            <template #right>
                <FTBtn
                    rounded
                    :to="{
                        name: 'event',
                        params: {
                            organisationId: eventOwner.organisationId,
                            propertyId: eventOwner.propertyId,
                            eventId: eventOwner.id,
                        },
                    }"
                    class="button-gradient"
                    >View
                </FTBtn>
            </template>
        </FTTitle>
        <FTTabs v-model="tab">
            <q-tab name="info" label="Info" />
            <q-tab name="edit" label="Edit" v-if="!isEventFinished(event.date)" />
            <q-tab name="logs" :label="logsLabelWithCount" />
        </FTTabs>
        <FTTabPanels v-model="tab" class="bg-transparent">
            <!-- General info area -->
            <q-tab-panel name="info" class="q-px-none q-py-none">
                <AppCardSection>
                    <AdminEventRTInfo
                        :floors="eventFloors"
                        :active-reservations="allReservations.filter(isActiveReservation)"
                        :returning-guests="returningGuests"
                    />
                </AppCardSection>

                <AppCardSection title="Reserved by status">
                    <AdminEventReservationsByPerson :reservations="allPlannedReservations" />
                </AppCardSection>

                <AppCardSection title="Guests">
                    <FTTabs v-model="reservationsTab">
                        <q-tab
                            name="arrivedReservations"
                            :label="`Arrived (${arrivedReservations.length})`"
                        />
                        <q-tab
                            name="cancelledReservations"
                            :label="`Cancelled (${cancelledReservations.length})`"
                        />
                        <q-tab
                            name="returningGuests"
                            :label="`Returning (${returningGuests.length})`"
                        />
                    </FTTabs>
                    <FTTabPanels v-model="reservationsTab">
                        <q-tab-panel name="arrivedReservations" class="q-pa-none">
                            <AdminEventReservationsList
                                :timezone="propertySettings.timezone"
                                :empty-message="`No arrived reservations`"
                                @delete="deleteReservationPermanently"
                                :reservations="arrivedReservations"
                            />
                        </q-tab-panel>
                        <q-tab-panel name="cancelledReservations">
                            <AdminEventReservationsList
                                :timezone="propertySettings.timezone"
                                :empty-message="`No cancelled reservations`"
                                @delete="deleteReservationPermanently"
                                :reservations="cancelledReservations"
                            />
                        </q-tab-panel>
                        <q-tab-panel name="returningGuests">
                            <AdminEventReturningGuestsList
                                :organisation-id="organisationId"
                                :returning-guests="returningGuests"
                            />
                        </q-tab-panel>
                    </FTTabPanels>
                </AppCardSection>
            </q-tab-panel>

            <!-- Edit area -->
            <q-tab-panel
                name="edit"
                v-if="!isEventFinished(event.date)"
                class="q-px-none q-py-none"
            >
                <AppCardSection title="Event Info">
                    <q-item clickable v-ripple>
                        <q-item-section>
                            <q-item-label caption lines="2">
                                {{ truncateText(event.info || "", 100) }}
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <FTBtn
                                rounded
                                icon="pencil"
                                class="button-gradient"
                                @click="showEventInfoEditDialog"
                            />
                        </q-item-section>
                    </q-item>
                </AppCardSection>

                <AppCardSection title="Event Floors">
                    <AdminEventFloorManager
                        :max-floors="subscriptionSettings.maxFloorPlansPerEvent"
                        :floors="eventFloors"
                        :available-floors="floors"
                        :reservations="allReservations"
                        :show-edit-button="true"
                        @add="addFloor"
                        @remove="removeFloor"
                        @edit="showFloorEditDialog"
                        @reorder="handleFloorReorder"
                    />
                </AppCardSection>
            </q-tab-panel>

            <!-- Logs -->
            <q-tab-panel name="logs" class="q-px-none q-py-none">
                <AdminEventLogs
                    :timezone="propertySettings.timezone"
                    :logs-doc="logs"
                    :is-admin="authStore.isAdmin"
                />
            </q-tab-panel>
        </FTTabPanels>
    </div>
</template>
