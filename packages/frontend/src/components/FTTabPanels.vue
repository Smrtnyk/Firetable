<script setup lang="ts">
const model = defineModel();
</script>

<template>
    <q-tab-panels
        v-model="model"
        v-bind="$attrs"
        animated
        transition-next="fade"
        transition-prev="fade"
        transition-duration="600"
    >
        <slot></slot>
    </q-tab-panels>
</template>
