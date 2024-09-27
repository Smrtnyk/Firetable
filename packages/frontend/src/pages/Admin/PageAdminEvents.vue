<script setup lang="ts">
import type { CreateEventPayload, EditEventPayload, EventDoc } from "@firetable/types";
import AdminPropertyEventsList from "src/components/admin/event/AdminPropertyEventsList.vue";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";

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
        },
    });
}

function showEventForm(event?: EventDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: event ? "Edit event" : t("PageAdminEvents.createNewEventDialogTitle"),
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                propertyId,
                floors: floors.value,
                organisationId,
                propertyName: propertiesStore.getPropertyNameById(propertyId),
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

onMounted(fetchMoreEvents);
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle title="Events">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showEventForm()" />
            </template>
        </FTTitle>

        <div v-if="events.length > 0 && !isLoadingEvents">
            <AdminPropertyEventsList
                :property-id="propertyId"
                :events="events"
                @delete="onEventItemSlideRight"
                @edit="(event: EventDoc) => showEventForm(event)"
                @load="fetchMoreEvents"
                :done="done"
            />
        </div>
    </div>
</template>
