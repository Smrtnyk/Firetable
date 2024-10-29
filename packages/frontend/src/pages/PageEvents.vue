<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import EventCardList from "src/components/Event/EventCardList.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

import { where, orderBy, limit } from "firebase/firestore";
import { ONE_HOUR } from "src/constants";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { useRouter } from "vue-router";
import { eventsCollection } from "@firetable/backend";
import { watch, onMounted, computed } from "vue";
import { Loading } from "quasar";
import { usePropertiesStore } from "src/stores/properties-store";
import { parseAspectRatio } from "src/helpers/utils";

interface Props {
    organisationId: string;
    propertyId: string;
}

const router = useRouter();
const props = defineProps<Props>();
const propertiesStore = usePropertiesStore();

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: "",
};

const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(props.propertyId);
});

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(settings.value.event.eventCardAspectRatio);
});

const { data: events, pending: isLoading } = useFirestoreCollection<EventDoc>(
    createQuery<EventDoc>(
        eventsCollection(eventOwner),
        where("date", ">=", Date.now() - ONE_HOUR * settings.value.event.eventDurationInHours),
        where("propertyId", "==", props.propertyId),
        orderBy("date"),
        limit(10),
    ),
);

watch(
    isLoading,
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
    if (!props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
});
</script>

<template>
    <div class="PageHome">
        <EventCardList
            v-if="events.length > 0 && !isLoading"
            :events="events"
            :aspect-ratio="cardsAspectRatio"
            :property-time-zone="propertySettings.timezone"
        />
        <FTCenteredText v-if="!isLoading && events.length === 0">
            There are no upcoming events
        </FTCenteredText>
    </div>
</template>
