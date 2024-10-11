<script setup lang="ts">
const model = defineModel<number | string>();
</script>

<template>
    <q-tab-panels
        v-model="model"
        v-bind="$attrs"
        animated
        transition-next="fade"
        transition-prev="fade"
        transition-duration="600"
        class="q-pa-none"
    >
        <slot></slot>
    </q-tab-panels>
</template>
