<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: string | number;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: string | number): void;
    (e: "input", value: any): void;
}>();

const selectedTab = ref(props.modelValue);

// Watch for external changes to modelValue and update selectedTab
watch(
    () => props.modelValue,
    (newValue) => {
        selectedTab.value = newValue;
    },
);

// Emit update event when selectedTab changes
watch(selectedTab, (newValue) => {
    emit("update:modelValue", newValue);
});

function handleInput(event: any): void {
    // Directly emit the input event
    emit("input", event);
}
</script>

<template>
    <q-tabs
        class="ft-q-tabs"
        v-model="selectedTab"
        outside-arrows
        mobile-arrows
        active-bg-color="primary"
        indicator-color="transparent"
        active-class="ft-active-tab"
        align="left"
        @input="handleInput"
    >
        <slot></slot>
    </q-tabs>
</template>

<style lang="scss">
.ft-q-tabs {
    margin-bottom: 8px;
    border-radius: $border-radius !important;
    box-shadow: $box-shadow !important;

    .q-tabs__content {
        border-radius: $border-radius !important;
    }

    .q-tab {
        border-radius: $border-radius !important;
        margin-right: 4px;
    }

    .ft-active-tab {
        color: white !important;
    }
}
</style>
