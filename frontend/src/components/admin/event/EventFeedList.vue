<script setup lang="ts">
import { formatEventDate } from "src/helpers/utils";
import { EventFeedDoc } from "src/types/event";

interface Props {
    eventFeed: EventFeedDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <q-list bordered separator v-if="props.eventFeed.length">
        <q-item v-for="(action, index) in props.eventFeed" :key="index">
            <q-item-section>
                <q-item-label>{{ action.body }}</q-item-label>
                <q-item-label caption>
                    {{ formatEventDate(action.timestamp) }}
                </q-item-label>
            </q-item-section>
        </q-item>
    </q-list>
    <h5 v-else class="text-subtitle2">No activity</h5>
</template>
