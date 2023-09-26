<script setup lang="ts">
import PushMessagesBanner from "components/PushMessagesBanner.vue";
import EventCardListSkeleton from "components/Event/EventCardListSkeleton.vue";
import { limit, where } from "firebase/firestore";
import { ClubDoc, Collection } from "@firetable/types";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
} from "src/composables/useFirestore";
import ClubCardList from "components/Club/ClubCardList.vue";
import { useAuthStore } from "stores/auth-store";

const authStore = useAuthStore();

const { data: clubs, pending: isLoading } = useFirestoreCollection<ClubDoc>(
    createQuery<ClubDoc>(
        getFirestoreCollection(Collection.CLUBS),
        where("ownerId", "==", authStore.user?.id),
        limit(10),
    ),
);
</script>

<template>
    <div class="PageHome">
        <PushMessagesBanner />
        <ClubCardList v-if="!!clubs.length && !isLoading" :clubs="clubs" />
        <EventCardListSkeleton v-if="isLoading" />
        <div v-if="!isLoading && !clubs.length" class="row justify-center items-center q-mt-md">
            <h2 class="text-h4">You have no clubs created</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
