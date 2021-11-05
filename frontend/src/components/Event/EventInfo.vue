<script setup lang="ts">
import { useEventsStore } from "src/stores/events-store";

interface Props {
    eventInfo: string;
}

const props = defineProps<Props>();
const eventsStore = useEventsStore();
</script>

<template>
    <q-dialog
        :model-value="eventsStore.showEventInfoModal"
        @update:model-value="eventsStore.toggleEventInfoModalVisibility"
    >
        <q-card>{{ props.eventInfo }}</q-card>
    </q-dialog>
</template>
