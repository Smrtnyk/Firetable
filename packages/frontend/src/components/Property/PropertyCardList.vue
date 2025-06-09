<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";

import PropertyCard from "src/components/Property/PropertyCard.vue";

interface Props {
    aspectRatio: number;
    properties: PropertyDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <v-row class="EventCardList">
        <v-col
            v-for="property in props.properties"
            :key="property.id"
            cols="12"
            sm="6"
            class="pa-1"
        >
            <PropertyCard :property="property" :aspect-ratio="props.aspectRatio" />
        </v-col>
    </v-row>
</template>
