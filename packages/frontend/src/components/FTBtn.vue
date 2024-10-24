<script setup lang="ts">
import { buttonSize } from "src/global-reactives/screen-detection.js";
</script>

<template>
    <q-btn v-bind="$attrs" :size="buttonSize">
        <slot />
    </q-btn>
</template>
