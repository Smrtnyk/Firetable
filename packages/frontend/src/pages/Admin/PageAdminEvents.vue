<script setup lang="ts">
import type { CreateEventPayload, EditEventPayload, EventDoc } from "@firetable/types";

import { negate } from "es-toolkit";
import { matchesProperty } from "es-toolkit/compat";
import AdminPropertyEventsList from "src/components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { useEvents } from "src/composables/useEvents";
import { useFloors } from "src/composables/useFloors";
import { createNewEvent, deleteDocAndAllSubCollections, getEventsPath, updateEvent } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onBeforeMount, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();

const router = useRouter();
const globalStore = useGlobalStore();
const { t } = useI18n();
const propertiesStore = usePropertiesStore();
const {
    done,
    events,
    fetchMoreEvents,
    isLoading: isLoadingEvents,
} = useEvents({ id: "", organisationId, propertyId });

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
            globalStore.setLoading(true);
        } else {
            globalStore.setLoading(false);
        }
    },
    { immediate: true },
);

onUnmounted(function () {
    globalStore.setLoading(false);
});

async function deleteEvent(event: EventDoc): Promise<void> {
    if (!(await globalDialog.confirm({ title: t("PageAdminEvents.deleteEventDialogTitle") }))) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteDocAndAllSubCollections(
                getEventsPath({
                    id: "",
                    organisationId,
                    propertyId: event.propertyId,
                }),
                event.id,
            );
            events.value = events.value.filter(negate(matchesProperty("id", event.id)));
        },
    });
}

async function onCreateEvent(eventData: CreateEventPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const { id: eventId } = (await createNewEvent(eventData)).data;
            globalStore.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
            await router.push({
                name: "adminEvent",
                params: { eventId, organisationId, propertyId },
            });
        },
    });
}

async function onUpdateEvent(eventData: EditEventPayload & { id: string }): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateEvent(
                {
                    id: eventData.id,
                    organisationId,
                    propertyId: eventData.propertyId,
                },
                eventData,
            );
            const updatedEvent = events.value.find(matchesProperty("id", eventData.id));
            if (updatedEvent) {
                Object.assign(updatedEvent, eventData);
            }
        },
    });
}

function showEventForm(event?: EventDoc): void {
    const dialog = globalDialog.openDialog(
        EventCreateForm,
        {
            create(eventData: CreateEventPayload) {
                onCreateEvent(eventData);
                globalDialog.closeDialog(dialog);
            },
            event,
            eventStartHours: propertySettings.value.event.eventStartTime24HFormat,
            floors: floors.value,
            maxFloors: subscriptionSettings.value.maxFloorPlansPerEvent,
            onUpdate(eventData: EditEventPayload) {
                if (!event) {
                    return;
                }
                onUpdateEvent({
                    ...eventData,
                    id: event.id,
                });
                globalDialog.closeDialog(dialog);
            },
            organisationId,
            propertyId,
            propertyName: propertiesStore.getPropertyNameById(propertyId),
            propertyTimezone: propertySettings.value.timezone,
        },
        {
            title: event
                ? t("PageAdminEvents.editEventDialogTitle", {
                      eventName: event.name,
                  })
                : t("PageAdminEvents.createNewEventDialogTitle"),
        },
    );
}

onMounted(fetchMoreEvents);
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle :title="t('PageAdminEvents.title')">
            <template #right>
                <FTBtn rounded icon="fa fa-plus" class="button-gradient" @click="showEventForm()" />
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
