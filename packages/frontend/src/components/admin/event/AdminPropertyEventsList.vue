<script setup lang="ts">
import type { EventDoc, VoidFunction } from "@firetable/types";
import PageAdminEventsListItem from "src/components/admin/event/PageAdminEventsListItem.vue";
import { computed } from "vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useI18n } from "vue-i18n";

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
const bucketizedEvents = computed(function () {
    const bucketized = new Map<string, Map<string, EventDoc[]>>();

    for (const event of props.events) {
        const date = new Date(event.date);
        const year = date.getUTCFullYear().toString();
        const month = date.toLocaleString(locale.value, { month: "long", timeZone: "UTC" });

        let yearMap = bucketized.get(year);
        if (!yearMap) {
            yearMap = new Map();
            bucketized.set(year, yearMap);
        }

        let monthEvents = yearMap.get(month);
        if (!monthEvents) {
            monthEvents = [];
            yearMap.set(month, monthEvents);
        }

        monthEvents.push(event);
    }

    return bucketized;
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
            <div v-for="[year, yearBuckets] in [...bucketizedEvents.entries()]" :key="year">
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

            <!-- Load More Button -->
            <div class="row justify-center q-my-md">
                <q-btn v-if="!props.done" label="Load More" @click="handleLoad" />
            </div>
        </template>
    </div>
</template>
