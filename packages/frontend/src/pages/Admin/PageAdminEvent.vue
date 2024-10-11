<script setup lang="ts">
import type { Component } from "vue";
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { isActiveReservation } from "@firetable/types";
import { deleteReservation, updateEventFloorData } from "@firetable/backend";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getTablesFromFloorDoc } from "@firetable/floor-creator";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/date-utils";

import FTTitle from "src/components/FTTitle.vue";
import AdminEventRTInfo from "src/components/admin/event/AdminEventRTInfo.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "src/components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "src/components/admin/event/AdminEventFloorViewer.vue";
import FTDialog from "src/components/FTDialog.vue";
import AdminEventLogs from "src/components/admin/event/AdminEventLogs.vue";
import AdminEventReservationsList from "src/components/admin/event/AdminEventReservationsList.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import AdminEventReturningGuestsList from "src/components/admin/event/AdminEventReturningGuestsList.vue";
import AppCardSection from "src/components/AppCardSection.vue";

import { Loading, useQuasar } from "quasar";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAdminEvent } from "src/composables/useAdminEvent";
import { buttonSize, isMobile } from "src/global-reactives/screen-detection";
import { truncateText } from "src/helpers/string-utils";
import { compressFloorDoc } from "src/helpers/compress-floor-doc";
import { useGuestsForEvent } from "src/composables/useGuestsForEvent";
import { usePropertiesStore } from "src/stores/properties-store";
import { property } from "es-toolkit/compat";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    organisationId: string;
    propertyId: string;
    eventId: string;
}

const PERMANENTLY_DELETE_RES_TITLE = "Permanently delete reservation?";
const PERMANENTLY_DELETE_RES_MESSAGE =
    "This will delete the reservation permanently, excluding it from all analytics. This cannot be undone.";

const props = defineProps<Props>();
const router = useRouter();
const quasar = useQuasar();
const propertiesStore = usePropertiesStore();

const tab = ref("info");
const reservationsTab = ref("arrivedReservations");
const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: props.eventId,
};

const authStore = useAuthStore();
const {
    eventFloors,
    event,
    isLoading,
    allPlannedReservations,
    allReservations,
    cancelledReservations,
    arrivedReservations,
    logs,
} = useAdminEvent(eventOwner);
const { returningGuests } = useGuestsForEvent(eventOwner, allReservations);
const allTables = computed(function () {
    return eventFloors.value.flatMap(getTablesFromFloorDoc);
});

const reservationsStatus = computed(function () {
    const activeReservations = allReservations.value.filter(isActiveReservation);
    const currentlyOccupied = activeReservations.filter(property("arrived")).length;
    const pending = activeReservations.length - currentlyOccupied;
    const totalGuests = activeReservations.reduce(function (acc, reservation) {
        return acc + Number(reservation.numberOfGuests || 0);
    }, 0);

    return {
        total: allTables.value.length,
        currentlyOccupied,
        pending,
        totalGuests,
    };
});

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

async function init(): Promise<void> {
    if (!props.eventId || !props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
}

async function onFloorUpdate(floor: FloorEditor): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return updateEventFloorData(eventOwner, {
                id: floor.id,
                json: compressFloorDoc(floor.json),
            });
        },
    });
}

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(
        eventFinishedLimit.getHours() + settings.value.event.eventDurationInHours,
    );
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

function showDialog(
    component: Component,
    title: string,
    componentPropsObject: Record<string, unknown> = {},
    listeners: Record<string, unknown> = {},
    maximized = isMobile.value,
): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            maximized,
            component,
            title,
            componentPropsObject,
            listeners,
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
            { floor, eventId: event.value.id },
            { update: onFloorUpdate },
            true,
        );
    }
}

async function deleteReservationPermanently(reservation: ReservationDoc): Promise<void> {
    if (!(await showConfirm(PERMANENTLY_DELETE_RES_TITLE, PERMANENTLY_DELETE_RES_MESSAGE))) {
        return;
    }
    await tryCatchLoadingWrapper({
        hook() {
            return deleteReservation(eventOwner, reservation);
        },
    });
}

onMounted(init);
</script>

<template>
    <div v-if="event && !isLoading" class="PageAdminEvent">
        <FTTitle :title="event.name" :subtitle="formatEventDate(event.date)">
            <template #right>
                <q-btn
                    :size="buttonSize"
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
                </q-btn>
            </template>
        </FTTitle>
        <FTTabs v-model="tab">
            <q-tab name="info" label="Info" />
            <q-tab name="edit" label="Edit" v-if="!isEventFinished(event.date)" />
            <q-tab name="logs" label="Logs" />
        </FTTabs>
        <FTTabPanels v-model="tab" class="bg-transparent">
            <!-- General info area -->
            <q-tab-panel name="info" class="q-px-xs-xs q-px-md-md q-py-none">
                <AppCardSection title="Tables status">
                    <AdminEventRTInfo :reservations-status="reservationsStatus" />
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
                                :empty-message="`No arrived reservations`"
                                @delete="deleteReservationPermanently"
                                :reservations="arrivedReservations"
                            />
                        </q-tab-panel>
                        <q-tab-panel name="cancelledReservations">
                            <AdminEventReservationsList
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
                class="q-px-xs-sm q-px-md-md q-py-none"
            >
                <AppCardSection title="Event Info">
                    <q-item clickable v-ripple>
                        <q-item-section>
                            <q-item-label caption lines="2">
                                {{ truncateText(event.info || "", 100) }}
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <q-btn
                                rounded
                                icon="pencil"
                                class="button-gradient"
                                size="md"
                                @click="showEventInfoEditDialog"
                            ></q-btn>
                        </q-item-section>
                    </q-item>
                </AppCardSection>

                <SettingsCard title="Event Floors">
                    <q-item :key="floor.id" v-for="floor in eventFloors" clickable v-ripple>
                        <q-item-section>
                            <q-item-label>
                                {{ floor.name }}
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <q-btn
                                class="button-gradient"
                                size="md"
                                icon="pencil"
                                rounded
                                @click="() => showFloorEditDialog(floor)"
                            >
                            </q-btn>
                        </q-item-section>
                    </q-item>
                </SettingsCard>
            </q-tab-panel>

            <!-- Logs -->
            <q-tab-panel name="logs" class="q-px-xs-sm q-px-md-md q-py-none">
                <AppCardSection title="">
                    <AdminEventLogs :logs-doc="logs" :is-admin="authStore.isAdmin" />
                </AppCardSection>
            </q-tab-panel>
        </FTTabPanels>
    </div>
</template>
