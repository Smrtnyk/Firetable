<script setup lang="ts">
import PageAdminEventsListItem from "components/Event/PageAdminEventsListItem.vue";
import { computed } from "vue";
import { EventDoc } from "@firetable/types";

interface Props {
    propertyId: string;
    eventsByProperty: Record<string, Set<EventDoc>>;
    onEventItemSlideRight: (eventDetails: { event: any; reset: () => void }) => void;
    onLoad: (propertyId: string, done: (stop: boolean) => void) => void;
}

const props = defineProps<Props>();
const events = computed(() => [...props.eventsByProperty[props.propertyId]]);
const eventsLength = computed(() => events.value.length);

function handleLoad(_: number, done: (stop: boolean) => void) {
    props.onLoad(props.propertyId, done);
}
</script>

<template>
    <div>
        <template v-if="!eventsLength">
            <div class="row justify-center items-center q-mt-md">
                <h6 class="q-ma-sm text-weight-bolder underline">
                    There are no events created for this property.
                </h6>
            </div>
        </template>
        <q-infinite-scroll v-else @load="handleLoad" :offset="50">
            <PageAdminEventsListItem
                v-for="event in events"
                :key="event.id"
                :event="event"
                @right="onEventItemSlideRight"
            />

            <q-separator spaced inset />
            <template #loading>
                <div class="row justify-center q-my-md">
                    <q-spinner-dots color="primary" size="40px" />
                </div>
            </template>
        </q-infinite-scroll>
    </div>
</template>
