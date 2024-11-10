<script setup lang="ts">
import { ref, watch } from "vue";
import { isMobile } from "src/global-reactives/screen-detection";

const props = defineProps<{
    modelValue: number | string;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: number | string): void;
    (e: "input", value: any): void;
}>();

const selectedTab = ref(props.modelValue);

watch(
    () => props.modelValue,
    function (newValue) {
        selectedTab.value = newValue;
    },
);

watch(selectedTab, function (newValue) {
    emit("update:modelValue", newValue);
});

function handleInput(event: any): void {
    emit("input", event);
}
</script>

<template>
    <div class="full-width">
        <q-tabs
            class="ft-q-tabs q-pa-none"
            v-model="selectedTab"
            outside-arrows
            mobile-arrows
            active-class="ft-active-tab"
            align="left"
            @input="handleInput"
            :dense="isMobile"
            narrow-indicator
        >
            <slot></slot>
        </q-tabs>
    </div>
</template>

<style lang="scss">
.ft-q-tabs {
    margin-bottom: 8px;
    border-radius: $border-radius !important;

    .q-tab__indicator {
        background: $gradient-primary;
    }

    .q-tab:not(:last-child) {
        margin-right: 4px;
    }
}
</style>
