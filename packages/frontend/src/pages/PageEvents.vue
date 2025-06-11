<script setup lang="ts">
import type { CreateEventPayload, EventDoc } from "@firetable/types";
import type { EventOwner } from "src/db";

import { limit, orderBy, where } from "firebase/firestore";
import { storeToRefs } from "pinia";
import { Loading, useQuasar } from "quasar";
import EventCreateForm from "src/components/admin/event/EventCreateForm.vue";
import EventCardList from "src/components/Event/EventCardList.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { useFloors } from "src/composables/useFloors";
import { ONE_HOUR } from "src/constants";
import { createNewEvent, eventsCollection } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { parseAspectRatio } from "src/helpers/utils";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();
const { t } = useI18n();
const propertiesStore = usePropertiesStore();
const { canCreateEvents } = storeToRefs(usePermissionsStore());

const eventOwner: EventOwner = {
    id: "",
    organisationId,
    propertyId,
};
const router = useRouter();
const quasar = useQuasar();
const subscriptionSettings = computed(function () {
    return propertiesStore.getOrganisationSubscriptionSettingsById(organisationId);
});
const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(propertyId);
});

const { createDialog } = useDialog();

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(propertySettings.value.event.eventCardAspectRatio);
});

const { floors, isLoading: isFloorsLoading } = useFloors(propertyId, organisationId);

const { data: events, pending: isLoading } = useFirestoreCollection<EventDoc>(
    createQuery<EventDoc>(
        eventsCollection(eventOwner),
        where(
            "date",
            ">=",
            Date.now() - ONE_HOUR * propertySettings.value.event.eventDurationInHours,
        ),
        where("propertyId", "==", propertyId),
        orderBy("date"),
        limit(10),
    ),
);
const isAnyLoading = computed(function () {
    return isFloorsLoading.value || isLoading.value;
});
watch(
    isAnyLoading,
    function (newIsLoading) {
        if (newIsLoading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

onMounted(async function () {
    if (!organisationId || !propertyId) {
        await router.replace("/");
    }
});

async function onCreateEvent(eventData: CreateEventPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewEvent(eventData);
            quasar.notify(t("PageAdminEvents.eventCreatedNotificationMessage"));
        },
    });
}

function showEventForm(event?: EventDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventCreateForm,
            componentPropsObject: {
                event,
                eventStartHours: propertySettings.value.event.eventStartTime24HFormat,
                floors: floors.value,
                maxFloors: subscriptionSettings.value.maxFloorPlansPerEvent,
                organisationId,
                propertyId,
                propertyName: propertiesStore.getPropertyNameById(propertyId),
                propertyTimezone: propertySettings.value.timezone,
            },
            listeners: {
                create(eventData: CreateEventPayload) {
                    onCreateEvent(eventData);
                    dialog.hide();
                },
            },
            maximized: false,
            title: t("PageAdminEvents.createNewEventDialogTitle"),
        },
    });
}
</script>

<template>
    <div class="PageHome">
        <FTTitle :title="t('PageEvents.title')">
            <template #right v-if="canCreateEvents">
                <FTBtn
                    class="button-gradient"
                    icon="fa fa-plus"
                    rounded
                    @click="() => showEventForm()"
                />
            </template>
        </FTTitle>

        <EventCardList
            v-if="events.length > 0 && !isLoading"
            :events="events"
            :aspect-ratio="cardsAspectRatio"
            :property-time-zone="propertySettings.timezone"
        />
        <FTCenteredText v-if="!isLoading && events.length === 0">
            {{ t("PageEvents.noEventsMessage") }}
        </FTCenteredText>
    </div>
</template>
