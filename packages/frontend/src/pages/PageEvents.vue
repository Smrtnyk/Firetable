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
        if (!newIsLoading) {
            Loading.hide();
        } else {
            Loading.show();
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="PageHome">
        <EventCardList v-if="!!events.length && !isLoading" :events="events" />
        <div v-if="!isLoading && !events.length" class="row justify-center items-center q-mt-md">
            <h2 class="text-h4">There are no upcoming events</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
