<script setup lang="ts">
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: number | string;
}>();
const emit = defineEmits<(e: "update:modelValue", value: number | string) => void>();
const { isMobile } = useScreenDetection();
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
</script>

<template>
    <div class="full-width">
        <v-tabs
            class="ft-tabs"
            v-model="selectedTab"
            selected-class="ft-active-tab"
            align-tabs="start"
            :density="isMobile ? 'compact' : 'default'"
            show-arrows
        >
            <slot></slot>
        </v-tabs>
    </div>
</template>

<style lang="scss">
@import "../css/variables";

.ft-tabs {
    margin-bottom: 8px;
    border-radius: $border-radius !important;

    .v-tabs-slider {
        background: $gradient-primary;
    }
}
</style>
