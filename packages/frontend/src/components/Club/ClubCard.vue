<script setup lang="ts">
import { ClubDoc } from "@firetable/types";

interface Props {
    club: ClubDoc;
}

const props = defineProps<Props>();
</script>

<template>
    <router-link
        class="EventCard__link"
        :to="{ name: 'events', params: { clubId: props.club.id } }"
    >
        <div class="EventCard">
            <div class="EventCard__image-container">
                <q-img
                    class="EventCard__image"
                    :src="props.club.img || 'images/default-event-img.jpg'"
                    alt=""
                    :ratio="1"
                />
            </div>

            <div class="EventCard__content">
                <h2 class="text-h3 q-ma-none">{{ props.club.name }}</h2>
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
