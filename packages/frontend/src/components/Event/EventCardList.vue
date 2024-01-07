<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import EventCard from "src/components/Event/EventCard.vue";

interface Props {
    events: EventDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div v-for="(event, index) in props.events" class="col-12 col-sm-6 q-pa-xs" :key="event.id">
            <EventCard :index="index" :event="event" />
        </div>
    </div>
</template>
