<script setup lang="ts">
import type { CreateEventPayload, EditEventPayload, EventDoc } from "@firetable/types";
import AdminPropertyEventsList from "src/components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTBtn from "src/components/FTBtn.vue";

import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed, onBeforeMount, watch, onUnmounted, onMounted } from "vue";
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
import { refreshApp } from "src/helpers/utils";

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
    events,
    fetchMoreEvents,
    done,
    isLoading: isLoadingEvents,
} = useEvents({ organisationId, propertyId, id: "" });

const { floors, isLoading: isFloorsLoading } = useFloors(propertyId, organisationId);
const isAnyLoading = computed(function () {
    return isFloorsLoading.value || isLoadingEvents.value;
});

const subscriptionSettings = computed(function () {
    return propertiesStore.getOrganisationSubscriptionSettingsById(organisationId);
});

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(propertyId);
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

onUnmounted(function () {
    if (Loading.isActive) {
        Loading.hide();
    }
});

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
            // FIXME: An ugly hack to force data reload
            refreshApp();
        },
    });
}

async function deleteEvent(event: EventDoc): Promise<void> {
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
            // FIXME: An ugly hack to force data reload
            refreshApp();
        },
    });
}

function showEventForm(event?: EventDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: event
                ? t("PageAdminEvents.editEventDialogTitle", {
                      eventName: event.name,
                  })
                : t("PageAdminEvents.createNewEventDialogTitle"),
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                propertyId,
                floors: floors.value,
                maxFloors: subscriptionSettings.value.maxFloorPlansPerEvent,
                organisationId,
                propertyName: propertiesStore.getPropertyNameById(propertyId),
                event,
                eventStartHours: propertySettings.value.event.eventStartTime24HFormat,
                propertyTimezone: propertySettings.value.timezone,
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

onMounted(fetchMoreEvents);
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle :title="t('PageAdminEvents.title')">
            <template #right>
                <FTBtn rounded icon="plus" class="button-gradient" @click="showEventForm()" />
            </template>
        </FTTitle>

        <div v-if="!isLoadingEvents">
            <AdminPropertyEventsList
                :events="events"
                :timezone="propertySettings.timezone"
                @delete="deleteEvent"
                @edit="showEventForm"
                @load="fetchMoreEvents"
                :done="done"
            />
        </div>
    </div>
</template>
