<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";

import { computed } from "vue";

interface Props {
    aspectRatio: number;
    property: PropertyDoc;
}

const props = defineProps<Props>();

const backgroundImageUrl = computed(function () {
    return props.property.img ?? `/images/default-property-img.jpg`;
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
            class="PropertyCard__link"
            :to="{
                name: 'events',
                params: {
                    propertyId: props.property.id,
                    organisationId: props.property.organisationId,
                },
            }"
        >
            <q-responsive :ratio="props.aspectRatio">
                <div class="PropertyCard__content column">
                    <q-space />

                    <h2 class="text-h3 q-mb-sm q-ml-none q-mt-none">{{ props.property.name }}</h2>
                </div>
            </q-responsive>
        </router-link>
    </div>
</template>

<style lang="scss">
.PropertyCard {
    border-radius: 0.5rem;

    img {
        border-radius: 0.5rem;
    }

    &__content {
        color: white;
        text-decoration: none !important;
        padding: 1rem;
        border-radius: 0.5rem;
    }
}
</style>
