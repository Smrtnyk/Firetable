<script setup lang="ts">
import { QColor, QPopupProxy } from "quasar";
import { ref, watch } from "vue";

type EmitEvents = (e: "update:modelValue", newColor: string) => void;

interface Props {
    modelValue: string;
    round?: boolean;
}

const { modelValue, round = false } = defineProps<Props>();

const emit = defineEmits<EmitEvents>();

const isOpen = ref(false);

const localColor = ref(modelValue);

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
    isOpen.value = true;
}
</script>

<template>
    <q-btn
        :round="round"
        flat
        icon="color-picker"
        :style="{ backgroundColor: localColor }"
        @click="openColorPicker"
    />

    <q-popup-proxy
        v-model="isOpen"
        transition-show="scale"
        transition-hide="scale"
        cover
        no-parent-event
        class="ft-card"
    >
        <q-color style="min-width: 250px" v-model="localColor" @change="onColorChanged" bordered />
    </q-popup-proxy>
</template>
