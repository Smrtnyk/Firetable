<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "src/stores/global-store";

const { isRouteLoading } = storeToRefs(useGlobalStore());
</script>

<template>
    <v-progress-linear
        v-if="isRouteLoading"
        indeterminate
        color="primary"
        class="route-loading-bar"
        size="3px"
    />
</template>

<style scoped>
.route-loading-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
}
</style>
