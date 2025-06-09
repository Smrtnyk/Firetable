<script setup lang="ts">
import { computed, ref, watch } from "vue";

type EmitEvents = (e: "update:modelValue", newColor: string) => void;

interface Props {
    disable?: boolean;
    flat?: boolean;
    modelValue: string;
    round?: boolean;
    size?: "lg" | "md" | "sm" | "xs";
}

const {
    disable = false,
    flat = true,
    modelValue,
    round = false,
    size = "md",
} = defineProps<Props>();

const emit = defineEmits<EmitEvents>();

const isOpen = ref(false);
const localColor = ref(modelValue);

const sizeMap = {
    lg: 40,
    md: 32,
    sm: 28,
    xs: 24,
};

const buttonSize = computed(function () {
    return `${sizeMap[size]}px`;
});

watch(
    () => modelValue,
    function (newVal) {
        localColor.value = newVal;
    },
);

// This function is now directly used by v-color-picker's update event
function onColorChanged(newVal: string): void {
    localColor.value = newVal;
    emit("update:modelValue", newVal);
}
</script>

<template>
    <v-tooltip location="top" :text="localColor">
        <template #activator="{ props: tooltipProps }">
            <v-menu
                v-model="isOpen"
                transition="scale-transition"
                :close-on-content-click="false"
                location="bottom"
            >
                <template #activator="{ props: menuProps }">
                    <v-btn
                        v-bind="{ ...tooltipProps, ...menuProps }"
                        :variant="flat ? 'text' : 'elevated'"
                        :rounded="round ? 'circle' : 'lg'"
                        :disabled="disable"
                        class="ft-color-picker-button"
                        :style="{
                            width: buttonSize,
                            height: buttonSize,
                            minWidth: 'unset',
                        }"
                        padding="0"
                    >
                        <!-- Checkered background for transparency -->
                        <div class="color-preview-container">
                            <div :class="round ? 'checkered-bg-round' : 'checkered-bg'" />
                            <div
                                class="color-preview"
                                :class="{ 'color-preview-round': round }"
                                :style="{ backgroundColor: localColor }"
                            />
                        </div>
                    </v-btn>
                </template>
                <v-color-picker
                    v-model="localColor"
                    @update:model-value="onColorChanged"
                    mode="hexa"
                    hide-inputs
                    style="min-width: 280px"
                />
            </v-menu>
        </template>
    </v-tooltip>
</template>

<style lang="scss" scoped>
.ft-color-picker-button {
    position: relative;
    border: 2px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    overflow: visible;

    // Vuetify's dark theme class is .v-theme--dark
    :deep(.v-theme--dark) & {
        border-color: rgba(255, 255, 255, 0.2);
    }

    &:hover:not(:disabled) {
        transform: scale(1.1);
        // Vuetify's theme color variable
        border-color: rgb(var(--v-theme-primary));
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

        :deep(.v-theme--dark) & {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
    }

    &:active:not(:disabled) {
        transform: scale(1.05);
    }

    &.v-btn--disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.color-preview-container {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
}

.checkered-bg,
.checkered-bg-round {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
        linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
        linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
    background-size: 8px 8px;
    background-position:
        0 0,
        0 4px,
        4px -4px,
        -4px 0;

    :deep(.v-theme--dark) & {
        background-image:
            linear-gradient(45deg, #424242 25%, transparent 25%),
            linear-gradient(-45deg, #424242 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #424242 75%),
            linear-gradient(-45deg, transparent 75%, #424242 75%);
    }
}

.checkered-bg {
    border-radius: 8px;
}

.checkered-bg-round {
    border-radius: 50%;
}

.color-preview {
    position: absolute;
    inset: 0;
    border-radius: 8px;

    &.color-preview-round {
        border-radius: 50%;
    }
}
</style>
