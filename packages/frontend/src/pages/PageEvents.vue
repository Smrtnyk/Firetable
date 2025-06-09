<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import type { EventOwner } from "src/db";

import { limit, orderBy, where } from "firebase/firestore";
import EventCardList from "src/components/Event/EventCardList.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { ONE_HOUR } from "src/constants";
import { eventsCollection } from "src/db";
import { parseAspectRatio } from "src/helpers/utils";
import { useGlobalStore } from "src/stores/global";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const router = useRouter();
const props = defineProps<Props>();
const globalStore = useGlobalStore();
const propertiesStore = usePropertiesStore();

const eventOwner: EventOwner = {
    id: "",
    organisationId: props.organisationId,
    propertyId: props.propertyId,
};

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(props.propertyId);
});

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(propertySettings.value.event.eventCardAspectRatio);
});

const { data: events, pending: isLoading } = useFirestoreCollection<EventDoc>(
    createQuery<EventDoc>(
        eventsCollection(eventOwner),
        where(
            "date",
            ">=",
            Date.now() - ONE_HOUR * propertySettings.value.event.eventDurationInHours,
        ),
        where("propertyId", "==", props.propertyId),
        orderBy("date"),
        limit(10),
    ),
);

watch(
    isLoading,
    function (newIsLoading) {
        if (newIsLoading) {
            globalStore.setLoading(true);
        } else {
            globalStore.setLoading(false);
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
