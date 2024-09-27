<script setup lang="ts">
import type { CreateEventPayload, EditEventPayload, EventDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { PropertyFloors } from "src/composables/useFloors";
import AdminPropertyEventsList from "src/components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed, onBeforeMount, ref, watch, onUnmounted } from "vue";
import { Loading, useQuasar } from "quasar";
import {
    createNewEvent,
    deleteDocAndAllSubCollections,
    getEventsPath,
    updateEvent,
} from "@firetable/backend";
import { useFloors } from "src/composables/useFloors";
import { useEvents } from "src/composables/useEvents";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { usePropertiesStore } from "src/stores/properties-store";
import { last } from "es-toolkit";
import { matchesProperty } from "es-toolkit/compat";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();

const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { createDialog } = useDialog();
const propertiesStore = usePropertiesStore();
const {
    eventsByProperty,
    fetchMoreEvents,
    hasMoreEventsToFetch,
    isLoading: isLoadingEvents,
    EVENTS_PER_PAGE,
} = useEvents();
const activePropertyId = ref("");
const properties = computed(function () {
    return propertiesStore.getPropertiesByOrganisationId(organisationId);
});

const { floors, isLoading: isFloorsLoading } = useFloors(propertyId, organisationId);
const isAnyLoading = computed(function () {
    return isFloorsLoading.value || isLoadingEvents.value;
});

const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(organisationId);
});

onBeforeMount(function () {
    if (!organisationId || !propertyId) {
        router.replace("/");
    }
});

watch(
    isAnyLoading,
    function (loading) {
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
    function (newProperties) {
        // Check if activePropertyId hasn't been set and properties are available
        if (!activePropertyId.value && newProperties.length > 0) {
            activePropertyId.value = newProperties[0].id;
        }

        newProperties.forEach(function (property) {
            eventsByProperty[property.id] = new Set();
            hasMoreEventsToFetch[property.id] = true;
        });
    },
    { immediate: true },
);

watch(
    activePropertyId,
    function () {
        fetchEventsForActiveTab();
    },
    { immediate: true },
);

onUnmounted(function () {
    if (Loading.isActive) {
        Loading.hide();
    }
});

function fetchEventsForActiveTab(): void {
    if (eventsByProperty[activePropertyId.value]?.size !== 0) {
        return;
    }
    const activeProperty = properties.value.find(matchesProperty("id", activePropertyId.value));
    if (!activeProperty) {
        showErrorMessage("Something went wrong. Please reload the page!");
        return;
    }
    const eventOwner: EventOwner = {
        propertyId,
        organisationId,
        id: "",
    };
    fetchMoreEvents(eventOwner, null);
}

async function onCreateEvent(eventData: CreateEventPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const { id: eventId } = (await createNewEvent(eventData)).data;
            quasar.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
            await router.push({
                name: "adminEvent",
                params: { eventId, propertyId, organisationId },
            });
        },
    });
}

async function onUpdateEvent(eventData: EditEventPayload & { id: string }): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateEvent(
                {
                    propertyId: eventData.propertyId,
                    organisationId,
                    id: eventData.id,
                },
                eventData,
            );
            // An ugly hack to force data reload
            window.location.reload();
        },
    });
}

async function onEventItemSlideRight(event: EventDoc): Promise<void> {
    if (!(await showConfirm(t("PageAdminEvents.deleteEventDialogTitle")))) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteDocAndAllSubCollections(
                getEventsPath({
                    propertyId: event.propertyId,
                    organisationId,
                    id: "",
                }),
                event.id,
            );
            eventsByProperty[activePropertyId.value].delete(event);
        },
    });
}

async function onLoad(): Promise<void> {
    if (!hasMoreEventsToFetch[propertyId]) {
        return;
    }

    const eventOwner: EventOwner = {
        propertyId,
        organisationId,
        id: "",
    };
    const lastDoc = last([...eventsByProperty[propertyId]])?._doc ?? null;
    const eventsDocs = await fetchMoreEvents(eventOwner, lastDoc);

    if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
        hasMoreEventsToFetch.value = false;
    }
}

function showEventForm(event?: EventDoc): void {
    const propertyFloors: PropertyFloors = {
        propertyId,
        floors: floors.value,
        organisationId,
        propertyName: propertiesStore.getPropertyNameById(propertyId),
    };
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: event ? "Edit event" : t("PageAdminEvents.createNewEventDialogTitle"),
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                propertyFloors,
                event,
                eventStartHours: settings.value.event.eventStartTime24HFormat,
            },
            listeners: {
                create(eventData: CreateEventPayload) {
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
        <FTTitle title="Events">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient q-mb-md"
                    @click="showEventForm()"
                />
            </template>
        </FTTitle>

        <FTCenteredText v-if="properties.length === 0 && !isLoadingEvents">
            {{ t("PageAdminEvents.noPropertiesMessage") }}
        </FTCenteredText>

        <div v-else>
            <AdminPropertyEventsList
                :property-id="propertyId"
                :events="Array.from(eventsByProperty[propertyId])"
                @delete="onEventItemSlideRight"
                @edit="(event: EventDoc) => showEventForm(event)"
                @load="onLoad"
                :done="!hasMoreEventsToFetch[propertyId]"
            />
        </div>
    </div>
</template>
