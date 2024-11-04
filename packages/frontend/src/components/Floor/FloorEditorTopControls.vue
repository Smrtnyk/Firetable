<script setup lang="ts">
import type { QPopupProxy } from "quasar";
import type { FloorEditor, FloorEditorElement } from "@firetable/floor-creator";
import { isTable } from "@firetable/floor-creator";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useEventListener } from "@vueuse/core";

interface Props {
    selectedFloorElement: FloorEditorElement;
    floorInstance: FloorEditor;
    deleteAllowed?: boolean;
    existingLabels: Set<string>;
}

type EmitEvents = (e: "delete", element: FloorEditorElement) => void;
const emit = defineEmits<EmitEvents>();
const {
    deleteAllowed = true,
    existingLabels,
    selectedFloorElement,
    floorInstance,
} = defineProps<Props>();
const colorPickerProxy = useTemplateRef<QPopupProxy>("colorPickerProxy");
const getElementWidth = computed(function () {
    return selectedFloorElement
        ? Math.round(selectedFloorElement.width * selectedFloorElement.scaleX)
        : 0;
});
const getElementHeight = computed(function () {
    return selectedFloorElement
        ? Math.round(selectedFloorElement.height * selectedFloorElement.scaleY)
        : 0;
});
const localWidth = ref(getElementWidth.value);
const localHeight = ref(getElementHeight.value);
const elementColor = ref(selectedFloorElement?.getBaseFill?.() ?? "");

watch(
    () => selectedFloorElement,
    function (newEl) {
        localWidth.value = newEl ? Math.round(newEl.width * newEl.scaleX) : 0;
        localHeight.value = newEl ? Math.round(newEl.height * newEl.scaleY) : 0;

        if (newEl?.getBaseFill) {
            elementColor.value = newEl.getBaseFill();
        }
    },
);

watch(localWidth, function (newWidth) {
    if (!selectedFloorElement) {
        return;
    }
    selectedFloorElement?.setDimensions?.(newWidth, localHeight.value);
});

watch(localHeight, function (newHeight) {
    if (!selectedFloorElement) {
        return;
    }
    selectedFloorElement?.setDimensions?.(localWidth.value, newHeight);
});

function sendBack(): void {
    selectedFloorElement?.canvas?.sendObjectBackwards(selectedFloorElement);
}

function setElementColor(newVal: string | null): void {
    if (!newVal) {
        return;
    }
    elementColor.value = newVal;
    selectedFloorElement?.setBaseFill?.(newVal);
}

function openColorPicker(): void {
    colorPickerProxy.value?.show();
}

function updateTableLabel(
    tableEl: FloorEditorElement | undefined,
    newLabel: number | string | null,
): void {
    if (typeof newLabel !== "string" || !isTable(tableEl)) {
        return;
    }
    if (existingLabels.has(newLabel)) {
        showErrorMessage("Table Id already taken");
        return;
    }
    tableEl.setLabel(newLabel);
}

function onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === "Delete" && selectedFloorElement) {
        deleteElement();
    }
}

async function deleteElement(): Promise<void> {
    if (!selectedFloorElement) {
        return;
    }
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement);
    }
}

onMounted(function () {
    useEventListener("keydown", onKeyDownListener);
});
</script>

<template>
    <q-card class="row FloorEditorTopControls ft-card q-pa-sm justify-evenly">
        <div class="col-2">
            <q-input v-model.number="localWidth" standout rounded type="number" label="Width" />
        </div>
        <div class="col-2">
            <q-input rounded v-model.number="localHeight" standout type="number" label="Height" />
        </div>
        <div class="col-3" v-if="isTable(selectedFloorElement)">
            <q-input
                :debounce="500"
                :model-value="selectedFloorElement.label"
                @update:model-value="(newLabel) => updateTableLabel(selectedFloorElement, newLabel)"
                type="text"
                standout
                rounded
                label="Table label"
            />
        </div>

        <div class="col-auto content-center q-gutter-md">
            <q-btn
                title="Change element fill color"
                v-if="elementColor"
                :style="{ 'background-color': elementColor }"
                @click="openColorPicker"
                round
            >
                <q-icon name="color-picker" class="cursor-pointer" />
                <q-popup-proxy
                    no-parent-event
                    ref="colorPickerProxy"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                >
                    <q-color :model-value="elementColor" @update:model-value="setElementColor" />
                </q-popup-proxy>
            </q-btn>
            <q-btn
                title="Delete element"
                v-if="deleteAllowed"
                round
                icon="trash"
                color="negative"
                @click="deleteElement"
            />
            <q-btn
                title="Send back"
                v-if="deleteAllowed"
                round
                icon="send-backward"
                @click="sendBack"
            />

            <q-btn
                title="Copy element"
                round
                icon="copy"
                @click="floorInstance.copySelectedElement()"
            />
            <q-btn
                v-if="'flip' in selectedFloorElement"
                title="Flip element"
                round
                icon="transfer"
                @click="selectedFloorElement.flip()"
            />
            <q-btn
                v-if="'changeToOutlinedMode' in selectedFloorElement"
                title="Switch to outline element"
                round
                icon="dashed-outline"
                @click="selectedFloorElement.changeToOutlinedMode()"
            />
            <q-btn
                v-if="'changeToFilledMode' in selectedFloorElement"
                title="Switch to fill element"
                round
                icon="fill"
                @click="selectedFloorElement.changeToFilledMode()"
            />
        </div>
    </q-card>
</template>

<style lang="scss">
.FloorEditorTopControls {
    position: absolute;
    top: 0.5%;
}
</style>
