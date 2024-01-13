<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";
import PropertyCard from "src/components/Property/PropertyCard.vue";

interface Props {
    properties: PropertyDoc[];
    aspectRatio: number;
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div
            v-for="property in props.properties"
            class="col-12 col-sm-6 q-pa-xs"
            :key="property.id"
        >
            <PropertyCard :property="property" :aspect-ratio="props.aspectRatio" />
        </div>
    </div>
</template>
