<script setup lang="ts">
import { PropertyDoc } from "@firetable/types";

interface Props {
    property: PropertyDoc;
}

const props = defineProps<Props>();
</script>

<template>
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
        <q-card class="PropertyCard">
            <q-img
                class="PropertyCard__parallax"
                :src="props.property.img || '/images/default-event-img.jpg'"
                alt=""
            />

            <q-card-section class="PropertyCard__content">
                <h2 class="text-h3 q-mb-sm q-ml-none q-mt-none">{{ props.property.name }}</h2>
            </q-card-section>
        </q-card>
    </router-link>
</template>

<style lang="scss">
.PropertyCard {
    position: relative;
    overflow: hidden;
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
        overflow: hidden;
        text-decoration: none !important;
        padding: 1rem;
        width: 100%;
        background: inherit;
        position: absolute;
        bottom: 0;
    }
}
</style>
