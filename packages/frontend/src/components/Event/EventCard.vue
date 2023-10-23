<script setup lang="ts">
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/utils";
import { EventDoc } from "@firetable/types";

interface Props {
    event: EventDoc;
}

const props = defineProps<Props>();
</script>

<template>
    <router-link
        class="EventCard__link"
        :to="{ name: 'event', params: { eventId: props.event.id } }"
    >
        <q-card class="EventCard">
            <q-parallax
                :src="props.event.img || '/images/default-event-img.jpg'"
                alt=""
                :ratio="1.5"
            />

            <q-card-section class="EventCard__content">
                <h2 class="text-h3 q-mb-sm q-ml-none q-mt-none">{{ props.event.name }}</h2>
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
            </q-card-section>
        </q-card>
    </router-link>
</template>

<style lang="scss">
.EventCard {
    box-shadow:
        0 0.25rem 0.25rem rgba(0, 0, 0, 0.2),
        0 0 1rem rgba(0, 0, 0, 0.2);

    &__link {
        text-decoration: none !important;
        color: currentColor;
        &:visited {
            color: currentColor;
        }
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
