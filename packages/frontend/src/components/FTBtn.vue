<script setup lang="ts">
import { useScreenDetection } from "src/global-reactives/screen-detection.js";
import { useSlots } from "vue";

const { buttonSize } = useScreenDetection();
const slots = useSlots();

const hasSlotContent = slots.default && slots.default().length > 0;
</script>

<template>
    <v-btn
        rounded="lg"
        v-if="$attrs.icon && !$attrs.label && !hasSlotContent"
        v-bind="$attrs"
        :size="buttonSize"
        elevation="0"
    />

    <v-btn v-else v-bind="$attrs" :size="buttonSize" elevation="0" rounded="lg">
        <slot />
    </v-btn>
</template>
