<script setup lang="ts">
const model = defineModel<number | string>();
</script>

<template>
    <v-window
        v-model="model"
        v-bind="$attrs"
        class="pa-0"
        transition="fade-transition"
        reverse-transition="fade-transition"
    >
        <slot></slot>
    </v-window>
</template>
