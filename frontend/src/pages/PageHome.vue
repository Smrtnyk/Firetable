<script setup lang="ts">
import EventCardList from "src/components/Event/EventCardList.vue";
import PushMessagesBanner from "src/components/PushMessagesBanner";
import { EventCardListSkeleton } from "src/components/Event/EventCardListSkeleton";
import { FTSubtitle } from "src/components/FTSubtitle";
import { useFirestore } from "src/composables/useFirestore";
import { query as firestoreQuery, where, orderBy, limit } from "@firebase/firestore";
import { Collection } from "src/types/firebase";
import { EventDoc } from "src/types/event";

const { data: events, loading: isLoading } = useFirestore<EventDoc>({
    type: "watch",
    queryType: "collection",
    path: Collection.EVENTS,
    query(collectionRef) {
        const whereConstraint = where("date", ">=", Date.now() - 60 * 60 * 1000 * 8);
        const orderByConstraint = orderBy("date");
        const limitConstraint = limit(10);
        return firestoreQuery(collectionRef, whereConstraint, orderByConstraint, limitConstraint);
    },
});
</script>

<template>
    <div class="PageHome">
        <PushMessagesBanner />
        <template v-if="!!events.length && !isLoading">
            <FTSubtitle>Events</FTSubtitle>
            <EventCardList :events="events" />
        </template>
        <EventCardListSkeleton v-if="isLoading" />

        <div v-if="!isLoading && !events.length" class="row justify-center items-center q-mt-md">
            <f-t-subtitle>There are no upcoming events</f-t-subtitle>
            <q-img src="no-events.svg" />
        </div>
    </div>
</template>
