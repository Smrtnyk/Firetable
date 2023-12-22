<script setup lang="ts">
import type { Component } from "vue";
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getTablesFromFloorDoc } from "@firetable/floor-creator";
import { ReservationStatus } from "@firetable/types";
import { updateEventFloorData } from "@firetable/backend";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/date-utils";

import FTTitle from "src/components/FTTitle.vue";
import AdminEventGeneralInfo from "src/components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "src/components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "src/components/admin/event/AdminEventFloorViewer.vue";
import FTDialog from "src/components/FTDialog.vue";
import AdminEventLogs from "src/components/admin/event/AdminEventLogs.vue";
import AdminEventCancelledReservationsList from "src/components/admin/event/AdminEventCancelledReservationsList.vue";

import { Loading, useQuasar } from "quasar";
import { config } from "src/config";
import { withLoading } from "src/helpers/ui-helpers";
import useAdminEvent from "src/composables/useAdminEvent";
import { buttonSize, isMobile } from "src/global-reactives/screen-detection";
import { truncateText } from "src/helpers/string-utils";
import { compressFloorDoc } from "src/helpers/compress-floor-doc";
import { propIsTruthy } from "@firetable/utils";

interface Props {
    organisationId: string;
    propertyId: string;
    eventId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const quasar = useQuasar();
const tab = ref("info");

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: props.eventId,
};

const { eventFloors, event, isLoading, reservations, logs } = useAdminEvent(eventOwner);

watch(
    isLoading,
    (newIsLoading) => {
        if (newIsLoading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    if (Loading.isActive) {
        Loading.hide();
    }
});

const allTables = computed(() => eventFloors.value.map(getTablesFromFloorDoc).flat());
const cancelledReservations = computed(() => reservations.value.filter(propIsTruthy("cancelled")));

const reservationsStatus = computed(() => {
    const activeReservations = reservations.value.filter((reservation) => {
        return (
            (!reservation.status || reservation.status === ReservationStatus.ACTIVE) &&
            !reservation.cancelled
        );
    });
    const unreserved = allTables.value.length - reservations.value.length;
    const pending = activeReservations.filter((reservation) => !reservation.confirmed).length;
    const confirmed = activeReservations.length - pending;
    const reserved = activeReservations.length;
    const totalGuests = activeReservations.reduce((acc, reservation) => {
        return acc + Number(reservation.numberOfGuests || 0);
    }, 0);

    return {
        total: allTables.value.length,
        cancelled: cancelledReservations.value.length,
        reserved,
        pending,
        confirmed,
        unreserved,
        totalGuests,
    };
});

async function init(): Promise<void> {
    if (!props.eventId || !props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
}

const onFloorUpdate = withLoading(async function (floor: FloorEditor) {
    return updateEventFloorData(eventOwner, {
        id: floor.id,
        json: await compressFloorDoc(floor.json),
    });
});

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(eventFinishedLimit.getHours() + config.eventDuration);
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
            eventInfo: event.value.info || "",
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

onMounted(init);
</script>

<template>
    <div v-if="event && !isLoading" class="PageAdminEvent">
        <FTTitle :title="event.name">
            <template #subtitle>
                <div class="column q-ml-md">
                    <span>
                        {{ formatEventDate(event.date) }}
                    </span>
                </div>
            </template>
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
        <q-tabs v-model="tab" align="justify">
            <q-tab name="info" label="Info" />
            <q-tab name="edit" label="Edit" v-if="!isEventFinished(event.date)" />
            <q-tab name="logs" label="Logs" />
        </q-tabs>
        <div class="q-gutter-y-md">
            <q-tab-panels v-model="tab" animated transition-next="fade" transition-prev="fade">
                <!-- General info with charts area -->
                <q-tab-panel name="info" class="q-pa-xs-sm q-pa-md-md">
                    <AdminEventGeneralInfo :reservations-status="reservationsStatus" />
                    <q-separator class="q-my-sm bg-grey-6" />
                    <AdminEventReservationsByPerson :reservations="reservations" />
                    <q-separator class="q-my-sm bg-grey-6" />
                    <AdminEventCancelledReservationsList
                        :cancelled-reservations="cancelledReservations"
                    />
                </q-tab-panel>

                <!-- Edit area -->
                <q-tab-panel name="edit" v-if="!isEventFinished(event.date)">
                    <div>
                        <h2 class="text-subtitle1">Event Info</h2>
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
                    </div>

                    <q-separator class="q-my-md" />

                    <div>
                        <h2 class="text-subtitle1">Event Floors</h2>
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
                    </div>
                </q-tab-panel>

                <!-- Logs -->
                <q-tab-panel name="logs" v-if="logs">
                    <AdminEventLogs :logs-doc="logs" />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
