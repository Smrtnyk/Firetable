<script setup lang="ts">
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { computed } from "vue";
import { usePropertiesStore } from "src/stores/usePropertiesStore";

const propertiesStore = usePropertiesStore();
const properties = computed(() => {
    return propertiesStore.properties;
});
</script>

<template>
    <div class="PageHome">
        <PropertyCardList v-if="properties.length" :properties="properties" />
        <div v-if="!properties.length" class="row justify-center items-center q-mt-md">
            <h2 class="text-h4">You have no properties created</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
