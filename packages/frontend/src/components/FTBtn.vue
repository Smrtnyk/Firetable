<script setup lang="ts">
import { useScreenDetection } from "src/global-reactives/screen-detection.js";

const { buttonSize } = useScreenDetection();
</script>

<template>
    <v-btn v-bind="$attrs" :size="buttonSize">
        <slot />
    </v-btn>
</template>
