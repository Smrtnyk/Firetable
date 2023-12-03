<script setup lang="ts">
import PropertyCard from "src/components/Property/PropertyCard.vue";
import type { PropertyDoc } from "@firetable/types";

interface Props {
    properties: PropertyDoc[];
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
            <PropertyCard :property="property" />
        </div>
    </div>
</template>
