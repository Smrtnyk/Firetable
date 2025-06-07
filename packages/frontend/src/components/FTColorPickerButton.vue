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

function onColorChanged(newVal: string): void {
    localColor.value = newVal;
    emit("update:modelValue", newVal);
}

function openColorPicker(): void {
    if (!disable) {
        isOpen.value = true;
    }
}
</script>

<template>
    <q-btn
        :flat="flat"
        :round="round"
        :disable="disable"
        padding="0"
        class="ft-color-picker-button"
        :style="{
            width: buttonSize,
            height: buttonSize,
            minHeight: 'unset',
        }"
        @click="openColorPicker"
    >
        <!-- Checkered background for transparency -->
        <div class="color-preview-container">
            <div class="checkered-bg" v-if="!round" />
            <div class="checkered-bg-round" v-else />
            <div
                class="color-preview"
                :class="{ 'color-preview-round': round }"
                :style="{ backgroundColor: localColor }"
            />
        </div>

        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
            {{ localColor }}
        </q-tooltip>
    </q-btn>

    <q-popup-proxy
        v-model="isOpen"
        transition-show="scale"
        transition-hide="scale"
        cover
        no-parent-event
        class="ft-card"
    >
        <q-color
            v-model="localColor"
            @change="onColorChanged"
            format-model="hexa"
            no-header
            no-footer
            bordered
            style="min-width: 280px"
        />
    </q-popup-proxy>
</template>

<style lang="scss" scoped>
.ft-color-picker-button {
    position: relative;
    border: 2px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    overflow: visible;

    .body--dark & {
        border-color: rgba(255, 255, 255, 0.2);
    }

    &:not(.q-btn--round) {
        border-radius: 6px;
    }

    &:hover:not(.disabled) {
        transform: scale(1.1);
        border-color: $primary;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

        .body--dark & {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
    }

    &:active:not(.disabled) {
        transform: scale(1.05);
    }

    &.disabled {
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

    .body--dark & {
        background-image:
            linear-gradient(45deg, #424242 25%, transparent 25%),
            linear-gradient(-45deg, #424242 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #424242 75%),
            linear-gradient(-45deg, transparent 75%, #424242 75%);
    }
}

.checkered-bg {
    border-radius: 4px;
}

.checkered-bg-round {
    border-radius: 50%;
}

.color-preview {
    position: absolute;
    inset: 0;
    border-radius: 4px;

    &.color-preview-round {
        border-radius: 50%;
    }
}
</style>
