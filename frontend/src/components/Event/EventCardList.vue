<script setup lang="ts">
import EventCard from "components/Event/EventCard.vue";
import { EventDoc } from "src/types/event";

interface Props {
    events: EventDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div v-for="event of props.events" class="col-12 col-sm-6 q-pa-xs" :key="event.id">
            <EventCard :event="event" />
        </div>
    </div>
</template>
