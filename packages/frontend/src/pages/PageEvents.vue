<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import EventCardList from "src/components/Event/EventCardList.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

import { where, orderBy, limit } from "firebase/firestore";
import { config } from "src/config";
import { ONE_HOUR } from "src/constants";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { useRouter } from "vue-router";
import { eventsCollection } from "@firetable/backend";
import { watch, onMounted } from "vue";
import { Loading } from "quasar";

interface Props {
    organisationId: string;
    propertyId: string;
}

const router = useRouter();
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
        where("propertyId", "==", props.propertyId),
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

onMounted(async () => {
    if (!props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
});
</script>

<template>
    <div class="PageHome">
        <EventCardList v-if="events.length > 0 && !isLoading" :events="events" />
        <FTCenteredText v-if="!isLoading && events.length === 0">
            There are no upcoming events
        </FTCenteredText>
    </div>
</template>
