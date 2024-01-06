<script setup lang="ts">
import type { CreateEventPayload, EditEventPayload, EventDoc, PropertyDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
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
import { computed, onBeforeMount, ref, watch, onUnmounted } from "vue";
import { Loading, useQuasar } from "quasar";
import {
    createNewEvent,
    deleteDocAndAllSubCollections,
    getEventsPath,
    updateEvent,
} from "@firetable/backend";
import { takeLast } from "@firetable/utils";
import { useFloors } from "src/composables/useFloors";
import { useEvents } from "src/composables/useEvents";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { usePropertiesStore } from "src/stores/properties-store";
import FTTabs from "src/components/FTTabs.vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "src/stores/auth-store";

const props = defineProps<{ organisationId: string }>();

const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { createDialog } = useDialog();
const propertiesStore = usePropertiesStore();
const { isAdmin } = storeToRefs(useAuthStore());
const {
    eventsByProperty,
    fetchMoreEvents,
    hasMoreEventsToFetch,
    isLoading: isLoadingEvents,
    EVENTS_PER_PAGE,
} = useEvents();
const activePropertyId = ref("");
const properties = computed(() => {
    return propertiesStore.properties.filter((property) => {
        return property.organisationId === props.organisationId;
    });
});

const { floors, isLoading: isFloorsLoading } = useFloors(properties);
const isAnyLoading = computed(() => {
    return isFloorsLoading.value || isLoadingEvents.value;
});

onBeforeMount(() => {
    if (!props.organisationId) {
        router.replace("/");
    }
});

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
    () => {
        fetchEventsForActiveTab();
    },
    { immediate: true },
);

onUnmounted(() => {
    if (Loading.isActive) {
        Loading.hide();
    }
});

function fetchEventsForActiveTab(): void {
    if (eventsByProperty[activePropertyId.value]?.size !== 0) {
        return;
    }
    const activeProperty = properties.value.find((property) => {
        return property.id === activePropertyId.value;
    });
    if (!activeProperty) {
        showErrorMessage("Something went wrong. Please reload the page!");
        return;
    }
    const eventOwner: EventOwner = {
        propertyId: activeProperty.id,
        organisationId: props.organisationId,
        id: "",
    };
    fetchMoreEvents(eventOwner, null);
}

const onCreateEvent = withLoading(async function (eventData: CreateEventPayload) {
    const { id: eventId, propertyId } = (await createNewEvent(eventData)).data;
    quasar.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
    await router.push({
        name: "adminEvent",
        params: { eventId, propertyId, organisationId: props.organisationId },
    });
});

const onUpdateEvent = withLoading(async function (eventData: EditEventPayload & { id: string }) {
    await updateEvent(
        {
            propertyId: eventData.propertyId,
            organisationId: props.organisationId,
            id: eventData.id,
        },
        eventData,
    );
    // An ugly hack to force data reload
    window.location.reload();
});

async function onEventItemSlideRight(event: EventDoc): Promise<void> {
    if (!(await showConfirm(t("PageAdminEvents.deleteEventDialogTitle")))) {
        return;
    }

    await tryCatchLoadingWrapper({
        hook: async () => {
            await deleteDocAndAllSubCollections(
                getEventsPath({
                    propertyId: event.propertyId,
                    organisationId: props.organisationId,
                    id: "",
                }),
                event.id,
            );
            eventsByProperty[activePropertyId.value].delete(event);
        },
    });
}

async function onEventEdit(property: PropertyDoc, event: EventDoc): Promise<void> {
    showCreateEventForm(property, event);
}

async function onLoad(property: PropertyDoc): Promise<void> {
    const propertyId = property.id;
    if (!hasMoreEventsToFetch[propertyId]) {
        return;
    }

    const eventOwner: EventOwner = {
        propertyId,
        organisationId: props.organisationId,
        id: "",
    };
    const lastDoc = takeLast([...eventsByProperty[propertyId]])?._doc ?? null;
    const eventsDocs = await fetchMoreEvents(eventOwner, lastDoc);

    if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
        hasMoreEventsToFetch.value = false;
    }
}

function showCreateEventForm(property: PropertyDoc, event?: EventDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: event ? "Edit event" : t("PageAdminEvents.createNewEventDialogTitle"),
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                property: floors.value[property.id],
                event,
            },
            listeners: {
                create: (eventData: CreateEventPayload) => {
                    onCreateEvent(eventData);
                    dialog.hide();
                },
                update(eventData: EditEventPayload) {
                    if (!event) {
                        return;
                    }
                    onUpdateEvent({
                        ...eventData,
                        id: event.id,
                    });
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

        <FTCenteredText v-if="properties.length === 0 && !isLoadingEvents">
            {{ t("PageAdminEvents.noPropertiesMessage") }}
        </FTCenteredText>

        <div v-else>
            <FTTabs v-model="activePropertyId" @input="fetchEventsForActiveTab">
                <q-tab
                    v-for="property in properties"
                    :key="property.id"
                    :label="property.name"
                    :name="property.id"
                />
            </FTTabs>

            <keep-alive>
                <q-tab-panels v-model="activePropertyId">
                    <q-tab-panel
                        v-for="property in properties"
                        :key="property.id"
                        :name="property.id"
                    >
                        <div class="row justify-end">
                            <q-btn
                                v-if="isAdmin"
                                rounded
                                icon="plus"
                                class="button-gradient q-mb-md"
                                @click="showCreateEventForm(property)"
                            />
                        </div>

                        <AdminPropertyEventsList
                            :property="property"
                            :events-by-property="eventsByProperty"
                            @delete="onEventItemSlideRight"
                            @edit="(event: EventDoc) => onEventEdit(property, event)"
                            @load="onLoad"
                            :done="!hasMoreEventsToFetch[property.id]"
                        />
                    </q-tab-panel>
                </q-tab-panels>
            </keep-alive>
        </div>
    </div>
</template>
