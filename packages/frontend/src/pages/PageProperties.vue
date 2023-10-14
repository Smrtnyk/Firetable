<script setup lang="ts">
import PushMessagesBanner from "components/PushMessagesBanner.vue";
import EventCardListSkeleton from "components/Event/EventCardListSkeleton.vue";
import PropertyCardList from "components/Property/PropertyCardList.vue";
import { useProperties } from "src/composables/useProperties";

const { properties, isLoading } = useProperties();
</script>

<template>
    <div class="PageHome">
        <PushMessagesBanner />
        <PropertyCardList v-if="!!properties.length && !isLoading" :properties="properties" />
        <EventCardListSkeleton v-if="isLoading" />
        <div
            v-if="!isLoading && !properties.length"
            class="row justify-center items-center q-mt-md"
        >
            <h2 class="text-h4">You have no properties created</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
