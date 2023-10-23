<script setup lang="ts">
import AdminPropertyEventsList from "components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "components/admin/event/EventCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, tryCatchLoadingWrapper, withLoading } from "src/helpers/ui-helpers";
import { computed, nextTick, ref, watch } from "vue";
import { Loading, useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { CreateEventPayload, EventDoc, PropertyDoc } from "@firetable/types";
import { createNewEvent, deleteEvent } from "@firetable/backend";
import { takeLast } from "@firetable/utils";
import { useFloors } from "src/composables/useFloors";
import { useProperties } from "src/composables/useProperties";
import { useEvents } from "src/composables/useEvents";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";

const EVENTS_PER_PAGE = 20;

const quasar = useQuasar();
const { t } = useI18n();
const router = useRouter();
const { createDialog } = useDialog();
const { properties, isLoading: isLoadingProperties } = useProperties();
const { floors } = useFloors();
const {
    eventsByProperty,
    fetchMoreEvents,
    hasMoreEventsToFetch,
    isLoading: isLoadingEvents,
} = useEvents();
const activePropertyId = ref("");
const initialLoadDone = ref<Record<string, boolean>>({});

const isAnyLoading = computed(() => isLoadingProperties.value || isLoadingEvents.value);

watch(
    isAnyLoading,
    (loading) => {
        if (loading) {
            Loading.show();
        } else {
            Loading.hide();
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

const onCreateEvent = withLoading(async function (eventData: CreateEventPayload) {
    const { data: id } = await createNewEvent(eventData);
    quasar.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
    await router.replace({
        name: "adminEvent",
        params: { id },
    });
});

async function onEventItemSlideRight({ event, reset }: { event: EventDoc; reset: () => void }) {
    if (!(await showConfirm(t("PageAdminEvents.deleteEventDialogTitle")))) return reset();

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
    createDialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminEvents.createNewEventDialogTitle"),
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
            v-if="properties.length === 0 && !isAnyLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminEvents.noPropertiesMessage") }}
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
                        <div class="row justify-end">
                            <q-btn
                                rounded
                                icon="plus"
                                class="button-gradient q-mb-md"
                                @click="showCreateEventForm(property)"
                            />
                        </div>

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
