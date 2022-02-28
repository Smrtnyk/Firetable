<script setup lang="ts">
import EventCardList from "components/Event/EventCardList.vue";
import PushMessagesBanner from "components/PushMessagesBanner.vue";
import EventCardListSkeleton from "components/Event/EventCardListSkeleton.vue";
import { useFirestore } from "src/composables/useFirestore";
import { query as firestoreQuery, where, orderBy, limit } from "@firebase/firestore";
import { config } from "src/config";
import { ONE_HOUR } from "src/constants";
import { Collection, EventDoc } from "@firetable/types";

const { data: events, loading: isLoading } = useFirestore<EventDoc>({
    type: "watch",
    path: Collection.EVENTS,
    query(collectionRef) {
        const whereConstraint = where("date", ">=", Date.now() - ONE_HOUR * config.eventDuration);
        const orderByConstraint = orderBy("date");
        const limitConstraint = limit(10);
        return firestoreQuery(collectionRef, whereConstraint, orderByConstraint, limitConstraint);
    },
});
</script>

<template>
    <div class="PageHome">
        <PushMessagesBanner />
        <EventCardList v-if="!!events.length && !isLoading" :events="events" />
        <EventCardListSkeleton v-if="isLoading" />
        <div v-if="!isLoading && !events.length" class="row justify-center items-center q-mt-md">
            <h2 class="text-h4">There are no upcoming events</h2>
            <q-img src="no-events.svg" />
        </div>
    </div>
</template>
