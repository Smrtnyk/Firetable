<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";

import { computed } from "vue";

interface Props {
    aspectRatio: number;
    property: PropertyDoc;
}

const props = defineProps<Props>();

const backgroundImageUrl = computed(function () {
    return props.property.img || `/images/default-property-img.jpg`;
});
</script>

<template>
    <div
        class="PropertyCard ft-card ft-border"
        :style="{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'rgba(0, 0, 0, 1)',
        }"
    >
        <router-link
            class="PropertyCard__link text-decoration-none"
            :to="{
                name: 'events',
                params: {
                    propertyId: props.property.id,
                    organisationId: props.property.organisationId,
                },
            }"
        >
            <v-responsive :aspect-ratio="props.aspectRatio">
                <div class="PropertyCard__content d-flex flex-column fill-height">
                    <v-spacer />

                    <h2 class="text-h3 mb-1 ml-0 mt-0">{{ props.property.name }}</h2>
                </div>
            </v-responsive>
        </router-link>
    </div>
</template>

<style lang="scss">
.PropertyCard {
    border-radius: 0.5rem;
    // The router-link should not have default text decoration
    &__link {
        text-decoration: none;
    }

    img {
        // This style might not be directly applicable if the image is a background
        border-radius: 0.5rem;
    }

    &__content {
        color: white;
        // text-decoration: none !important; // Handled by __link class now
        padding: 1rem; // Vuetify equivalent could be pa-4 if using spacing helpers
        border-radius: 0.5rem;
        height: 100%; // Ensure content div takes full height of v-responsive
    }
}
</style>
