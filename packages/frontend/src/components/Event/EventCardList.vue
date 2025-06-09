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
    <v-row class="EventCardList">
        <v-col v-for="(event, index) in events" :key="event.id" cols="12" sm="6" class="pa-1">
            <EventCard
                :property-timezone="propertyTimeZone"
                :index="index"
                :event="event"
                :aspect-ratio="aspectRatio"
            />
        </v-col>
    </v-row>
</template>
