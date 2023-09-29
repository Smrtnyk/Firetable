<script setup lang="ts">
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/utils";
import { EventDoc } from "@firetable/types";

interface Props {
    event: EventDoc;
}

const props = defineProps<Props>();
</script>

<template>
    <router-link class="EventCard__link" :to="{ name: 'event', params: { id: props.event.id } }">
        <div class="EventCard">
            <div class="event-success-indicator" v-if="props.event.reservedPercentage >= 75">
                <q-icon name="fire" color="warning" class="bg-warning-shadow rounded" size="md" />
                <q-tooltip>
                    {{ Math.round(props.event.reservedPercentage) }}% of tables are reserved. Event
                    is performing well!
                </q-tooltip>
            </div>

            <div class="EventCard__image-container">
                <q-img
                    class="EventCard__image"
                    :src="props.event.img || '/images/default-event-img.jpg'"
                    alt=""
                    :ratio="1"
                />
            </div>

            <div class="EventCard__content">
                <h2 class="text-h3 q-ma-none">{{ props.event.name }}</h2>
                <q-icon
                    name="calendar"
                    color="white"
                    class="gradient-warning q-pa-xs rounded"
                    size="xs"
                />
                {{ dateFromTimestamp(props.event.date) }}

                <q-icon
                    name="clock"
                    color="white"
                    class="q-ml-sm gradient-positive q-pa-xs rounded"
                    size="xs"
                />
                {{ hourFromTimestamp(props.event.date) }}

                <q-icon
                    name="euro"
                    color="white"
                    class="q-ml-sm gradient-pink q-pa-xs rounded"
                    size="xs"
                />
                {{ props.event.entryPrice || "Free" }}
            </div>
        </div>
    </router-link>
</template>

<style lang="scss">
.EventCard {
    position: relative;
    background: #333;
    width: 100%;
    border-radius: 6px;
    color: #aaa;
    box-shadow:
        0 0.25rem 0.25rem rgba(0, 0, 0, 0.2),
        0 0 1rem rgba(0, 0, 0, 0.2);
    overflow: hidden;

    &__link {
        text-decoration: none;
    }

    .event-success-indicator {
        position: absolute;
        top: 5px;
        right: 5px;
        z-index: 2;
    }

    &__content {
        text-decoration: none !important;
        padding: 1rem;
        width: 100%;
        background: inherit;
        position: absolute;
        bottom: 0;
    }
}
</style>
