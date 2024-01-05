<script setup lang="ts">
import type { EventDoc, PropertyDoc } from "@firetable/types";
import PageAdminEventsListItem from "src/components/admin/event/PageAdminEventsListItem.vue";
import { computed } from "vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    property: PropertyDoc;
    eventsByProperty: Record<string, Set<EventDoc>>;
    done: boolean;
}

const emit = defineEmits<{
    (e: "delete" | "edit", value: EventDoc): void;
    (e: "load", value: PropertyDoc): void;
}>();

const props = defineProps<Props>();
const events = computed(() => [...props.eventsByProperty[props.property.id]]);
const eventsLength = computed(() => events.value.length);
const bucketizedEvents = computed(() => {
    const eventsArr = [...props.eventsByProperty[props.property.id]];
    const bucketized = new Map<string, Map<string, EventDoc[]>>();

    for (const event of eventsArr) {
        const date = new Date(event.date);
        const year = date.getUTCFullYear().toString();
        const month = date.toLocaleString("default", { month: "long", timeZone: "UTC" });

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

function handleLoad(): void {
    emit("load", props.property);
}

function emitDelete(event: EventDoc, reset: () => void): void {
    emit("delete", event);
    reset();
}

function emitEdit(event: EventDoc, reset: () => void): void {
    emit("edit", event);
    reset();
}
</script>

<template>
    <div>
        <FTCenteredText v-if="!eventsLength">
            There are no events created for this property.
        </FTCenteredText>
        <template v-else>
            <div v-for="[year, yearBuckets] in [...bucketizedEvents.entries()]" :key="year">
                <p>{{ year }}</p>

                <div v-for="[month, monthEvents] in [...yearBuckets.entries()]" :key="month">
                    <p>{{ month }}</p>

                    <PageAdminEventsListItem
                        v-for="event in monthEvents"
                        :key="event.id"
                        :event="event"
                        @right="({ reset }) => emitDelete(event, reset)"
                        @left="({ reset }) => emitEdit(event, reset)"
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
