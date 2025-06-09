<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";

import PropertyCard from "src/components/Property/PropertyCard.vue";

interface Props {
    properties: PropertyDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList">
        <v-row>
            <v-col
                v-for="property in props.properties"
                :key="property.id"
                cols="12"
                sm="6"
                class="pa-1"
            >
                <PropertyCard :property="property" />
            </v-col>
        </v-row>
    </div>
</template>
