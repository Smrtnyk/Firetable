<script setup lang="ts">
import AdminPropertyEventsList from "components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "components/admin/event/EventCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { nextTick, ref, watch } from "vue";
import { Loading, useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { CreateEventPayload, EventDoc, PropertyDoc } from "@firetable/types";
import { createNewEvent, deleteEvent } from "@firetable/backend";
import { takeLast } from "@firetable/utils";
import { useFloors } from "src/composables/useFloors";
import { useProperties } from "src/composables/useProperties";
import { useEvents } from "src/composables/useEvents";

const EVENTS_PER_PAGE = 20;

const quasar = useQuasar();
const router = useRouter();
const { properties, isLoading } = useProperties();
const { floors } = useFloors();
const { eventsByProperty, fetchMoreEvents, hasMoreEventsToFetch } = useEvents();
const activePropertyId = ref("");
const initialLoadDone = ref<Record<string, boolean>>({});

watch(
    isLoading,
    (newIsLoading) => {
        if (!newIsLoading) {
            Loading.hide();
        } else {
            Loading.show();
        }
    },
    { immediate: true },
);

watch(
    properties,
    (newProperties) => {
        // Check if activePropertyId hasn't been set and properties are available
        if (!activePropertyId.value && newProperties.length > 0) {
            activePropertyId.value = newProperties[0].id;
        }

        newProperties.forEach((property) => {
            eventsByProperty[property.id] = new Set();
        });
    },
    { immediate: true },
);

watch(
    activePropertyId,
    (_, oldVal) => {
        if (oldVal !== undefined) {
            fetchEventsForActiveTab();
        }
    },
    { immediate: false },
);

function fetchEventsForActiveTab() {
    if (eventsByProperty[activePropertyId.value]?.size === 0) {
        fetchMoreEvents(activePropertyId.value, null);
    }
}

function onCreateEvent(eventData: CreateEventPayload) {
    tryCatchLoadingWrapper({
        hook: async () => {
            const { data: id } = await createNewEvent(eventData);
            quasar.notify("Event created!");
            await router.replace({
                name: "adminEvent",
                params: { id },
            });
        },
    });
}

async function onEventItemSlideRight({ event, reset }: { event: EventDoc; reset: () => void }) {
    if (!(await showConfirm("Delete Event?"))) return reset();

    await tryCatchLoadingWrapper({
        hook: async () => {
            await deleteEvent(event.id);
            eventsByProperty[activePropertyId.value].delete(event);
        },
        errorHook: reset,
    });
}

async function onLoad(propertyId: string, done: (stop: boolean) => void) {
    if (initialLoadDone.value[propertyId]) {
        if (!hasMoreEventsToFetch.value) {
            await nextTick();
            done(true);
            return;
        }
    } else {
        initialLoadDone.value[propertyId] = true;
    }

    console.log("onLoad called with:", propertyId, done);

    const lastDoc = takeLast([...eventsByProperty[propertyId]])?._doc || null;
    const eventsDocs = await fetchMoreEvents(propertyId, lastDoc);

    if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
        hasMoreEventsToFetch.value = false;
    }
    await nextTick();
    done(true);
}

function showCreateEventForm(property: PropertyDoc): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Create new event",
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                property: floors.value[property.id],
            },
            listeners: {
                create: onCreateEvent,
            },
        },
    });
}
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle title="Events" />

        <div
            v-if="properties.length === 0 && !isLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                There are no properties created, cannot create events.
            </h6>
        </div>

        <div v-else>
            <q-tabs v-model="activePropertyId" @input="fetchEventsForActiveTab">
                <q-tab
                    v-for="property in properties"
                    :key="property.id"
                    :label="property.name"
                    :name="property.id"
                />
            </q-tabs>

            <keep-alive>
                <q-tab-panels v-model="activePropertyId">
                    <q-tab-panel
                        v-for="property in properties"
                        :key="property.id"
                        :name="property.id"
                    >
                        <q-btn
                            rounded
                            icon="plus"
                            class="button-gradient"
                            @click="showCreateEventForm(property)"
                            label="new event"
                        />
                        <AdminPropertyEventsList
                            :property-id="property.id"
                            :events-by-property="eventsByProperty"
                            :on-event-item-slide-right="onEventItemSlideRight"
                            :on-load="onLoad"
                        />
                    </q-tab-panel>
                </q-tab-panels>
            </keep-alive>
        </div>
    </div>
</template>
