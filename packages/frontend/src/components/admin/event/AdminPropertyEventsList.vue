<script setup lang="ts">
import PageAdminEventsListItem from "components/Event/PageAdminEventsListItem.vue";
import { computed } from "vue";
import { EventDoc } from "@firetable/types";

interface Props {
    propertyId: string;
    eventsByProperty: Record<string, Set<EventDoc>>;
    onEventItemSlideRight: (eventDetails: { event: any; reset: () => void }) => void;
    onLoad: (propertyId: string) => void;
    done: boolean;
}

const props = defineProps<Props>();
const events = computed(() => [...props.eventsByProperty[props.propertyId]]);
const eventsLength = computed(() => events.value.length);

function handleLoad() {
    props.onLoad(props.propertyId);
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
        <template v-else>
            <PageAdminEventsListItem
                v-for="event in events"
                :key="event.id"
                :event="event"
                @right="onEventItemSlideRight"
            />

            <!-- Load More Button -->
            <div class="row justify-center q-my-md">
                <q-btn v-if="!props.done" label="Load More" @click="handleLoad" />
            </div>
        </template>
    </div>
</template>
