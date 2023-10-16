<script setup lang="ts">
import PropertyCardList from "components/Property/PropertyCardList.vue";
import { useProperties } from "src/composables/useProperties";
import { watch } from "vue";
import { Loading } from "quasar";

const { properties, isLoading } = useProperties();

watch(isLoading, (newIsLoading) => {
    if (!newIsLoading) {
        Loading.hide();
    } else {
        Loading.show();
    }
});
</script>

<template>
    <div class="PageHome">
        <PropertyCardList v-if="!!properties.length && !isLoading" :properties="properties" />
        <div
            v-if="!isLoading && !properties.length"
            class="row justify-center items-center q-mt-md"
        >
            <h2 class="text-h4">You have no properties created</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
