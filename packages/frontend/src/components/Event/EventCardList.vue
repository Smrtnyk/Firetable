<script setup lang="ts">
import EventCard from "src/components/Event/EventCard.vue";
import type { EventDoc } from "@firetable/types";

interface Props {
    events: EventDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div v-for="event in props.events" class="col-12 col-sm-6 q-pa-xs" :key="event.id">
            <EventCard :event="event" />
        </div>
    </div>
</template>
