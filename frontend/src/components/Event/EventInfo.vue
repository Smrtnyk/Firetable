<script setup lang="ts">
import { useEventsStore } from "src/stores/events-store";

interface Props {
    eventInfo: string;
}

const props = defineProps<Props>();
const eventsStore = useEventsStore();
</script>

<template>
    <div>{{ props.eventInfo }}</div>
</template>
