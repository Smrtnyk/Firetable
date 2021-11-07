<script setup lang="ts">
import { EventDoc } from "src/types/event";
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/utils";

interface Props {
    event: EventDoc;
}

const props = defineProps<Props>();
</script>

<template>
    <router-link :to="{ name: 'event', params: { id: props.event.id } }">
        <div class="news-card">
            <div class="event-success-indicator" v-if="props.event.reservedPercentage >= 75">
                <q-icon name="fire" color="warning" class="bg-warning-shadow rounded" size="md" />
                <q-tooltip>
                    {{ props.event.reservedPercentage }}% of tables are reserved. Event is
                    performing well!
                </q-tooltip>
            </div>
            <q-img
                basic
                :src="props.event.img || 'images/default-event-img.jpg'"
                alt=""
                class="news-card__image"
                :ratio="1"
            />
            <div class="news-card__text-wrapper">
                <h3 class="news-card__title">{{ props.event.name }}</h3>
                <div class="news-card__post-date">
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
        </div>
    </router-link>
</template>

<style lang="scss">
.news-card {
    border: 0px solid aqua;
    position: relative;
    border-radius: 0.5rem;
    flex: 1;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
    transform: translate3d(0, 0, 0);
}

.news-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0)
        linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.7) 80%);
    z-index: 0;
}

.news-card__image {
    transition: transform 3s ease;
    position: relative;
    z-index: -1;
}

.news-card__text-wrapper {
    right: 0;
    left: 0;
    position: absolute;
    bottom: 0;
    padding: 1rem;
    color: white;
    /*     background-color: rgba(0, 0, 0, 0.4); */
    transition: background-color 1.5s ease;
}

.news-card__title {
    transition: color 1s ease;
    margin-bottom: 0.5rem;
}

.news-card__post-date {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #ccc;
}

.news-card:hover .news-card__image {
    transform: scale(1.2);
    z-index: -1;
}

.event-success-indicator {
    position: absolute;
    top: 5px;
    right: 5px;
}
</style>
