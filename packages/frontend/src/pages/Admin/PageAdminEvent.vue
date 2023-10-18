<script setup lang="ts">
import { Component, computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";

import FTTitle from "components/FTTitle.vue";
import EventFeedList from "components/admin/event/EventFeedList.vue";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "components/admin/event/AdminEventFloorViewer.vue";
import AdminEventActiveStaff from "components/admin/event/AdminEventActiveStaff.vue";
import FTDialog from "components/FTDialog.vue";

import { Loading, useQuasar } from "quasar";
import { config } from "src/config";
import { Floor, FloorMode, getTablesFromFloorDoc } from "@firetable/floor-creator";
import { FloorDoc, User } from "@firetable/types";
import { updateEventFloorData, updateEventProperty } from "@firetable/backend";
import { tryCatchLoadingWrapper, withLoading } from "src/helpers/ui-helpers";
import { propIsTruthy } from "@firetable/utils";
import useAdminEvent from "src/composables/useAdminEvent";

interface Props {
    id: string;
}

const props = defineProps<Props>();
const router = useRouter();
const quasar = useQuasar();
const tab = ref("info");

const { eventFloors, users, event, eventFeed, isLoading } = useAdminEvent(props.id);

watch(
    isLoading,
    (newIsLoading) => {
        console.log("new loading", newIsLoading);
        if (!newIsLoading) {
            Loading.hide();
        } else {
            Loading.show();
        }
    },
    { immediate: true },
);

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(eventFinishedLimit.getHours() + config.eventDuration);
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

const eventData = computed(() => eventFloors.value.map(getTablesFromFloorDoc).flat());

const reservationsStatus = computed(() => {
    const tables = eventData.value;
    const reservations = tables.filter(propIsTruthy("reservation"));
    const unreserved = tables.length - reservations.length;
    const pending = reservations.filter((table) => !table.reservation?.confirmed).length;
    const confirmed = reservations.length - pending;
    const reserved = reservations.length;

    return {
        total: tables.length,
        reserved,
        pending,
        confirmed,
        unreserved,
    };
});

async function init() {
    if (!props.id) {
        await router.replace("/");
    }
}

const onFloorUpdate = withLoading(function (floor: Floor) {
    return updateEventFloorData(floor, props.id);
});

function onUpdateActiveStaff(newActiveStaff: User["id"][]) {
    if (!event.value) return;
    const eventId = event.value.id;
    tryCatchLoadingWrapper({
        hook: () => updateEventProperty(eventId, "activeStaff", newActiveStaff),
    });
}

function showDialog(
    component: Component,
    title: string,
    componentPropsObject: Record<string, unknown> = {},
    listeners: Record<string, unknown> = {},
) {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
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
            eventInfo: event.value.info,
            eventId: event.value.id,
        });
    }
}

function showFloorEditDialog(floor: FloorDoc): void {
    if (event.value) {
        showDialog(
            AdminEventFloorViewer,
            `Editing Floor: ${floor.name}`,
            { floor, mode: FloorMode.EDITOR, eventId: event.value.id },
            { update: onFloorUpdate },
        );
    }
}

function showAssignStaffDialog(): void {
    if (event.value) {
        showDialog(
            AdminEventActiveStaff,
            "Active Staff",
            {
                eventId: event.value.id,
                users: users.value,
                activeStaff: new Set(event.value.activeStaff || []),
            },
            { updateActiveStaff: onUpdateActiveStaff },
        );
    }
}

onMounted(init);
</script>

<template>
    <div v-if="event && !isLoading" class="PageAdminEvent">
        <FTTitle :title="event.name">
            <template #right>
                <div class="column">
                    <span class="text-caption">Event date</span>
                    <span>
                        {{ formatEventDate(event.date) }}
                    </span>
                </div>
            </template>
        </FTTitle>
        <q-tabs
            v-model="tab"
            align="justify"
            switch-indicator
            active-class="button-gradient"
            narrow-indicator
        >
            <q-tab name="info" label="Info" />
            <q-tab name="activity" label="Activity" />
            <q-tab name="edit" label="Edit" v-if="!isEventFinished(event.date)" />
        </q-tabs>
        <div class="q-gutter-y-md">
            <q-tab-panels v-model="tab" animated transition-next="fade" transition-prev="fade">
                <!-- General info with charts area -->
                <q-tab-panel name="info">
                    <AdminEventGeneralInfo :reservations-status="reservationsStatus" />
                    <q-separator class="q-my-sm bg-grey-6" />
                    <AdminEventReservationsByPerson :reservations="eventData" />
                </q-tab-panel>

                <!-- Activity area -->
                <q-tab-panel name="activity">
                    <EventFeedList :event-feed="eventFeed" />
                </q-tab-panel>

                <!-- Edit area -->
                <q-tab-panel name="edit" v-if="!isEventFinished(event.date)">
                    <div class="column justify-between">
                        <q-btn
                            class="button-gradient"
                            size="md"
                            rounded
                            @click="showEventInfoEditDialog"
                        >
                            Event info
                        </q-btn>

                        <q-separator class="q-my-md" />
                        <h2 class="text-subtitle1">Event Floors</h2>
                        <q-btn
                            class="button-gradient q-mb-sm"
                            size="md"
                            rounded
                            v-for="floor in eventFloors"
                            :key="floor.id"
                            @click="() => showFloorEditDialog(floor)"
                        >
                            {{ floor.name }}
                        </q-btn>

                        <!-- Staff assigned to an event -->
                        <q-separator class="q-my-md" />
                        <h2 class="text-subtitle1">Active Staff</h2>
                        <q-btn
                            class="button-gradient q-mb-sm"
                            size="md"
                            rounded
                            @click="showAssignStaffDialog"
                        >
                            Assign active staff
                        </q-btn>
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
