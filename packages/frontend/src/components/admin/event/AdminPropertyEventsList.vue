<script setup lang="ts">
import type { EventDoc } from "@firetable/types";

import PageAdminEventsListItem from "src/components/admin/event/PageAdminEventsListItem.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    done: boolean;
    events: EventDoc[];
    timezone: string;
}

const emit = defineEmits<{
    (e: "delete" | "edit", value: EventDoc): void;
    (e: "load"): void;
}>();
const { locale, t } = useI18n();
const { done, events, timezone } = defineProps<Props>();
const eventsLength = computed(function () {
    return events.length;
});
const bucketizedEvents = computed(function () {
    const upcomingEvents = new Map<string, Map<string, EventDoc[]>>();
    const pastEvents = new Map<string, Map<string, EventDoc[]>>();
    const now = new Date();

    for (const event of events) {
        const eventDate = new Date(event.date);
        const isPastEvent = eventDate < now;

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

    // Sort monthEvents by date within each month, ascending
    for (const targetBucket of [upcomingEvents, pastEvents]) {
        for (const yearMap of targetBucket.values()) {
            for (const monthEvents of yearMap.values()) {
                monthEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }
        }
    }

    return {
        pastEvents,
        upcomingEvents,
    };
});

const hasUpcomingEvents = computed(() => {
    return bucketizedEvents.value.upcomingEvents.size > 0;
});

const hasPastEvents = computed(() => {
    return bucketizedEvents.value.pastEvents.size > 0;
});

function emitDelete(event: EventDoc): void {
    emit("delete", event);
}

function emitEdit(event: EventDoc): void {
    emit("edit", event);
}

function handleLoad(): void {
    emit("load");
}
</script>

<template>
    <div class="pa-1">
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
                    <p class="text-subtitle-1 font-weight-bold mt-3 mb-1">{{ year }}</p>

                    <div
                        class="mb-2"
                        v-for="[month, monthEvents] in [...yearBuckets.entries()]"
                        :key="month"
                    >
                        <p class="text-subtitle-2 ml-2 mb-1">{{ month }}</p>

                        <PageAdminEventsListItem
                            v-for="event in monthEvents"
                            :key="event.id"
                            :event="event"
                            :timezone="timezone"
                            @delete="() => emitDelete(event)"
                            @edit="() => emitEdit(event)"
                        />
                    </div>
                </div>
            </div>

            <!-- Past Events Marker -->
            <div v-if="hasPastEvents && hasUpcomingEvents" class="mt-4">
                <p class="text-subtitle-1 font-weight-bold">
                    {{ t("PageAdminEvents.pastEventsLabel") }}
                </p>
            </div>
            <div v-else-if="hasPastEvents && !hasUpcomingEvents" class="mt-2">
                <p class="text-subtitle-1 font-weight-bold">
                    {{ t("PageAdminEvents.pastEventsLabel") }}
                </p>
            </div>

            <!-- Past Events -->
            <div v-if="hasPastEvents">
                <div
                    v-for="[year, yearBuckets] in [...bucketizedEvents.pastEvents.entries()]"
                    :key="'past-' + year"
                >
                    <p
                        class="text-subtitle-1 font-weight-bold mt-3 mb-1"
                        v-if="
                            hasUpcomingEvents ||
                            (bucketizedEvents.pastEvents.size > 1 &&
                                [...bucketizedEvents.pastEvents.keys()][0] !== year)
                        "
                    >
                        {{ year }}
                    </p>
                    <p
                        class="text-subtitle-1 font-weight-bold mt-1 mb-1"
                        v-else-if="!hasUpcomingEvents && bucketizedEvents.pastEvents.size === 1"
                    >
                        {{ year }}
                    </p>

                    <div
                        class="mb-2"
                        v-for="[month, monthEvents] in [...yearBuckets.entries()]"
                        :key="month"
                    >
                        <p class="text-subtitle-2 ml-2 mb-1">{{ month }}</p>

                        <PageAdminEventsListItem
                            v-for="event in monthEvents"
                            :key="event.id"
                            :event="event"
                            :timezone="timezone"
                            @delete="() => emitDelete(event)"
                            @edit="() => emitEdit(event)"
                        />
                    </div>
                </div>
            </div>

            <!-- Load More Button -->
            <div class="d-flex justify-center my-4">
                <v-btn v-if="!done" @click="handleLoad"> Load More </v-btn>
            </div>
        </template>
    </div>
</template>
