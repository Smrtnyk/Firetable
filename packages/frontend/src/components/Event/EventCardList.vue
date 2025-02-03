<script setup lang="ts">
import type { EventDoc } from "@firetable/types";

import EventCard from "src/components/Event/EventCard.vue";

interface Props {
    aspectRatio: number;
    events: EventDoc[];
    propertyTimeZone: string;
}
const { aspectRatio, events, propertyTimeZone } = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div v-for="(event, index) in events" class="col-12 col-sm-6 q-pa-xs" :key="event.id">
            <EventCard
                :property-timezone="propertyTimeZone"
                :index="index"
                :event="event"
                :aspect-ratio="aspectRatio"
            />
        </div>
    </div>
</template>
