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
const bucketizedEvents = computed(() => {
    const eventsArr = [...props.eventsByProperty[props.propertyId]];
    let bucketized = new Map<string, Map<string, EventDoc[]>>();

    for (let event of eventsArr) {
        const date = new Date(event.date);
        const year = date.getFullYear().toString();
        const month = date.toLocaleString("default", { month: "long" }); // Gets full month name.

        if (!bucketized.has(year)) {
            bucketized.set(year, new Map());
        }

        if (!bucketized.get(year)!.has(month)) {
            bucketized.get(year)!.set(month, []);
        }

        bucketized.get(year)!.get(month)!.push(event);
    }

    return bucketized;
});

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
            <div v-for="[year, yearBuckets] in [...bucketizedEvents.entries()]" :key="year">
                <p>{{ year }}</p>

                <div v-for="[month, monthEvents] in [...yearBuckets.entries()]" :key="month">
                    <p>{{ month }}</p>

                    <PageAdminEventsListItem
                        v-for="event in monthEvents"
                        :key="event.id"
                        :event="event"
                        @right="props.onEventItemSlideRight"
                    />
                </div>
            </div>

            <!-- Load More Button -->
            <div class="row justify-center q-my-md">
                <q-btn v-if="!props.done" label="Load More" @click="handleLoad" />
            </div>
        </template>
    </div>
</template>
