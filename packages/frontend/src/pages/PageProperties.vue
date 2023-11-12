<script setup lang="ts">
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { computed } from "vue";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import FTCenteredText from "src/components/FTCenteredText.vue";

const propertiesStore = usePropertiesStore();
const properties = computed(() => {
    return propertiesStore.properties;
});
</script>

<template>
    <div class="PageHome">
        <PropertyCardList v-if="properties.length" :properties="properties" />
        <FTCenteredText v-if="!properties.length && !propertiesStore.arePropertiesLoading">
            You have no properties created
        </FTCenteredText>
    </div>
</template>
