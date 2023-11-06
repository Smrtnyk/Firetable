<script setup lang="ts">
import AdminPropertyEventsList from "src/components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";

import {
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
    withLoading,
} from "src/helpers/ui-helpers";
import { computed, ref, watch } from "vue";
import { Loading, useQuasar } from "quasar";
import { CreateEventPayload, EventDoc, PropertyDoc } from "@firetable/types";
import {
    createNewEvent,
    deleteDocAndAllSubCollections,
    EventOwner,
    getEventsPath,
} from "@firetable/backend";
import { takeLast } from "@firetable/utils";
import { useFloors } from "src/composables/useFloors";
import { useProperties } from "src/composables/useProperties";
import { useEvents } from "src/composables/useEvents";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import FTCenteredText from "src/components/FTCenteredText.vue";

const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { createDialog } = useDialog();
const { properties, isLoading: isLoadingProperties } = useProperties();
const { floors } = useFloors();
const {
    eventsByProperty,
    fetchMoreEvents,
    hasMoreEventsToFetch,
    isLoading: isLoadingEvents,
    EVENTS_PER_PAGE,
} = useEvents();
const activePropertyId = ref("");

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
            hasMoreEventsToFetch[property.id] = true;
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

function fetchEventsForActiveTab(): void {
    if (eventsByProperty[activePropertyId.value]?.size === 0) {
        const activeProperty = properties.value.find((property) => {
            return property.id === activePropertyId.value;
        });
        if (!activeProperty) {
            showErrorMessage("Something went wrong. Please reload the page!");
            return;
        }
        const eventOwner: EventOwner = {
            propertyId: activeProperty.id,
            organisationId: activeProperty.organisationId,
            id: "",
        };
        fetchMoreEvents(eventOwner, null);
    }
}

const onCreateEvent = withLoading(async function (eventData: CreateEventPayload) {
    const { id: eventId, organisationId, propertyId } = (await createNewEvent(eventData)).data;
    quasar.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
    await router.replace({
        name: "adminEvent",
        params: { eventId, propertyId, organisationId },
    });
});

async function onEventItemSlideRight({
    event,
    reset,
}: {
    event: EventDoc;
    reset: () => void;
}): Promise<void> {
    if (!(await showConfirm(t("PageAdminEvents.deleteEventDialogTitle")))) return reset();
    await tryCatchLoadingWrapper({
        hook: async () => {
            await deleteDocAndAllSubCollections(
                getEventsPath({
                    propertyId: event.propertyId,
                    organisationId: event.organisationId,
                    id: "",
                }),
                event.id,
            );
            eventsByProperty[activePropertyId.value].delete(event);
        },
        errorHook: reset,
    });
}

async function onLoad(property: PropertyDoc): Promise<void> {
    const propertyId = property.id;
    if (!hasMoreEventsToFetch[propertyId]) {
        return;
    }

    const eventOwner: EventOwner = {
        propertyId,
        organisationId: property.organisationId,
        id: "",
    };
    const lastDoc = takeLast([...eventsByProperty[propertyId]])?._doc || null;
    const eventsDocs = await fetchMoreEvents(eventOwner, lastDoc);

    if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
        hasMoreEventsToFetch.value = false;
    }
}

function showCreateEventForm(property: PropertyDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminEvents.createNewEventDialogTitle"),
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                property: floors.value[property.id],
            },
            listeners: {
                create: (eventData: CreateEventPayload) => {
                    onCreateEvent(eventData);
                    dialog.hide();
                },
            },
        },
    });
}
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle title="Events" />

        <FTCenteredText v-if="properties.length === 0 && !isAnyLoading">
            {{ t("PageAdminEvents.noPropertiesMessage") }}
        </FTCenteredText>

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
                            :property="property"
                            :events-by-property="eventsByProperty"
                            :on-event-item-slide-right="onEventItemSlideRight"
                            :on-load="onLoad"
                            :done="!hasMoreEventsToFetch[property.id]"
                        />
                    </q-tab-panel>
                </q-tab-panels>
            </keep-alive>
        </div>
    </div>
</template>
