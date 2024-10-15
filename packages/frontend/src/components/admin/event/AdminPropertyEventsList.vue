<script setup lang="ts">
import type { EventDoc, VoidFunction } from "@firetable/types";

import PageAdminEventsListItem from "src/components/admin/event/PageAdminEventsListItem.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

import { useI18n } from "vue-i18n";
import { computed } from "vue";

interface Props {
    propertyId: string;
    events: EventDoc[];
    done: boolean;
}

const emit = defineEmits<{
    (e: "delete" | "edit", value: EventDoc): void;
    (e: "load"): void;
}>();
const { locale, t } = useI18n();
const props = defineProps<Props>();
const eventsLength = computed(function () {
    return props.events.length;
});
const bucketizedEvents = computed(() => {
    const upcomingEvents = new Map<string, Map<string, EventDoc[]>>();
    const pastEvents = new Map<string, Map<string, EventDoc[]>>();
    const now = new Date();

    for (const event of props.events) {
        const eventDate = new Date(event.date);
        const isPastEvent = eventDate < now;

        // Decide which bucket to put the event in
        const targetBucket = isPastEvent ? pastEvents : upcomingEvents;

        const year = eventDate.getUTCFullYear().toString();
        const month = eventDate.toLocaleString(locale.value, {
            month: "long",
            timeZone: "UTC",
        });

        let yearMap = targetBucket.get(year);
        if (!yearMap) {
            yearMap = new Map();
            targetBucket.set(year, yearMap);
        }

        let monthEvents = yearMap.get(month);
        if (!monthEvents) {
            monthEvents = [];
            yearMap.set(month, monthEvents);
        }

        monthEvents.push(event);
    }

    return {
        upcomingEvents,
        pastEvents,
    };
});

const hasUpcomingEvents = computed(() => {
    return bucketizedEvents.value.upcomingEvents.size > 0;
});

const hasPastEvents = computed(() => {
    return bucketizedEvents.value.pastEvents.size > 0;
});

function handleLoad(): void {
    emit("load");
}

function emitDelete(event: EventDoc, reset: VoidFunction): void {
    emit("delete", event);
    reset();
}

function emitEdit(event: EventDoc, reset: VoidFunction): void {
    emit("edit", event);
    reset();
}
</script>

<template>
    <div class="q-pa-sm">
        <FTCenteredText v-if="!eventsLength">
            {{ t("PageAdminEvents.noEventsMessage") }}
        </FTCenteredText>
        <template v-else>
            <!-- Upcoming Events -->
            <div v-if="hasUpcomingEvents">
                <div
                    v-for="[year, yearBuckets] in [...bucketizedEvents.upcomingEvents.entries()]"
                    :key="'upcoming-' + year"
                >
                    <p>
                        <b>{{ year }}</b>
                    </p>

                    <div
                        class="q-mb-sm"
                        v-for="[month, monthEvents] in [...yearBuckets.entries()]"
                        :key="month"
                    >
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
            </div>

            <!-- Past Events Marker -->
            <div v-if="hasPastEvents">
                <p>
                    <b>{{ t("PageAdminEvents.pastEventsLabel") }}</b>
                </p>
            </div>

            <!-- Past Events -->
            <div v-if="hasPastEvents">
                <div
                    v-for="[year, yearBuckets] in [...bucketizedEvents.pastEvents.entries()]"
                    :key="'past-' + year"
                >
                    <p>
                        <b>{{ year }}</b>
                    </p>

                    <div
                        class="q-mb-sm"
                        v-for="[month, monthEvents] in [...yearBuckets.entries()]"
                        :key="month"
                    >
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
            </div>

            <!-- Load More Button -->
            <div class="row justify-center q-my-md">
                <q-btn v-if="!props.done" label="Load More" @click="handleLoad" />
            </div>
        </template>
    </div>
</template>
