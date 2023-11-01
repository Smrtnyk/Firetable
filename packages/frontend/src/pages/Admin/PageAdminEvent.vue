<script setup lang="ts">
import { Component, computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";

import FTTitle from "components/FTTitle.vue";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";
import AdminEventReservationsByPerson from "components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventEditInfo from "components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorViewer from "components/admin/event/AdminEventFloorViewer.vue";
import FTDialog from "components/FTDialog.vue";

import { Loading, useQuasar } from "quasar";
import { config } from "src/config";
import { FloorEditor, FloorMode, getTablesFromFloorDoc } from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";
import { EventOwner, updateEventFloorData } from "@firetable/backend";
import { withLoading } from "src/helpers/ui-helpers";
import { propIsTruthy } from "@firetable/utils";
import useAdminEvent from "src/composables/useAdminEvent";
import { isMobile } from "src/global-reactives/is-mobile";

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

const { eventFloors, event, isLoading } = useAdminEvent(eventOwner);

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
    if (!props.eventId || !props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
}

const onFloorUpdate = withLoading(function (floor: FloorEditor) {
    return updateEventFloorData(eventOwner, floor);
});

function showDialog(
    component: Component,
    title: string,
    componentPropsObject: Record<string, unknown> = {},
    listeners: Record<string, unknown> = {},
    maximized = isMobile.value,
) {
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
            { floor, mode: FloorMode.EDITOR, eventId: event.value.id },
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
                        <!--                        <q-separator class="q-my-md" />-->
                        <!--                        <h2 class="text-subtitle1">Active Staff</h2>-->
                        <!--                        <q-btn-->
                        <!--                            class="button-gradient q-mb-sm"-->
                        <!--                            size="md"-->
                        <!--                            rounded-->
                        <!--                            @click="showAssignStaffDialog"-->
                        <!--                        >-->
                        <!--                            Assign active staff-->
                        <!--                        </q-btn>-->
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>
