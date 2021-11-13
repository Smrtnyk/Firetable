<script setup lang="ts">
import { EventDoc } from "src/types/event";
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/utils";

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
                    {{ props.event.reservedPercentage }}% of tables are reserved. Event is
                    performing well!
                </q-tooltip>
            </div>

            <div class="EventCard__image-container">
                <q-img
                    class="EventCard__image"
                    :src="props.event.img || 'images/default-event-img.jpg'"
                    alt=""
                    :ratio="1"
                />
            </div>

            <svg class="EventCard__svg" viewBox="0 0 800 500">
                <path
                    d="M -1 234.242 Q 46.152 228.549 100 250 Q 227.928 327.265 340.124 303.347 C 430.01 284.258 463.499 216.411 635.836 278.559 Q 744.46 320.792 800 300 L 800 500 L 0 500"
                    stroke="transparent"
                    fill="#333"
                />
                <path
                    class="EventCard__line"
                    d="M -1 234.242 Q 46.152 228.549 100 250 Q 227.928 327.265 340.124 303.347 C 430.01 284.258 463.499 216.411 635.836 278.559 Q 744.46 320.792 800 300"
                    stroke="pink"
                    stroke-width="3"
                    fill="transparent"
                />
            </svg>

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
    box-shadow: 0 0.25rem 0.25rem rgba(0, 0, 0, 0.2), 0 0 1rem rgba(0, 0, 0, 0.2);
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

    &__line {
        opacity: 0;
        animation: LineFadeIn 0.8s 0.8s forwards ease-in;
    }

    &__image {
        opacity: 0;
        animation: ImageFadeIn 0.8s 1.4s forwards;
    }

    &__content {
        text-decoration: none !important;
        padding: 1rem;
        width: 100%;
        background: inherit;
        position: absolute;
        bottom: 0;
    }

    &__svg {
        position: absolute;
        left: 0;
        bottom: 20px;
    }
}

@keyframes LineFadeIn {
    0% {
        opacity: 0;
        d: path("M 0 300 Q 0 300 0 300 Q 0 300 0 300 C 0 300 0 300 0 300 Q 0 300 0 300 ");
        stroke: #fff;
    }
    50% {
        opacity: 1;
        d: path(
            "M 0 300 Q 50 300 100 300 Q 250 300 350 300 C 350 300 500 300 650 300 Q 750 300 800 300"
        );
        stroke: #888bff;
    }
    100% {
        opacity: 1;
        d: path(
            "M -1 234.242 Q 46.152 228.549 100 250 Q 227.928 327.265 340.124 303.347 C 430.01 284.258 463.499 216.411 635.836 278.559 Q 744.46 320.792 800 300"
        );
        stroke: #545581;
    }
}

@keyframes ImageFadeIn {
    0% {
        transform: translate(-0.5rem, -0.5rem) scale(1.05);
        opacity: 0;
        filter: blur(2px);
    }
    50% {
        opacity: 1;
        filter: blur(2px);
    }
    100% {
        transform: translateY(0) scale(1);
        opacity: 1;
        filter: blur(0);
    }
}
</style>
