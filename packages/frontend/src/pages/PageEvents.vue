<script setup lang="ts">
import EventCardList from "src/components/Event/EventCardList.vue";
import { where, orderBy, limit } from "firebase/firestore";
import { config } from "src/config";
import { ONE_HOUR } from "src/constants";
import { EventDoc } from "@firetable/types";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { useRoute } from "vue-router";
import { EventOwner, eventsCollection } from "@firetable/backend";
import { watch } from "vue";
import { Loading } from "quasar";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    organisationId: string;
    propertyId: string;
}

const route = useRoute();
const props = defineProps<Props>();

const eventOwner: EventOwner = {
    propertyId: props.propertyId,
    organisationId: props.organisationId,
    id: "",
};

const { data: events, pending: isLoading } = useFirestoreCollection<EventDoc>(
    createQuery<EventDoc>(
        eventsCollection(eventOwner),
        where("date", ">=", Date.now() - ONE_HOUR * config.eventDuration),
        where("propertyId", "==", route.params.propertyId),
        orderBy("date"),
        limit(10),
    ),
);

watch(
    isLoading,
    (newIsLoading) => {
        if (newIsLoading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="PageHome">
        <EventCardList v-if="events.length > 0 && !isLoading" :events="events" />
        <FTCenteredText v-if="!isLoading && events.length === 0">
            There are no upcoming events
        </FTCenteredText>
    </div>
</template>
