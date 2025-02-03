<script setup lang="ts">
import type { FloorEditor, FloorEditorElement } from "@firetable/floor-creator";

import {
    isTable,
    setDimensions,
    setElementAngle,
    setElementPosition,
} from "@firetable/floor-creator";
import { useEventListener } from "@vueuse/core";
import { debounce, isString } from "es-toolkit";
import FTColorPickerButton from "src/components/FTColorPickerButton.vue";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, onMounted, ref, watch } from "vue";

type EmitEvents = (e: "delete", element: FloorEditorElement) => void;

interface Props {
    deleteAllowed?: boolean;
    existingLabels: Set<string>;
    floorInstance: FloorEditor;
    selectedFloorElement: FloorEditorElement;
}
const emit = defineEmits<EmitEvents>();
const {
    deleteAllowed = true,
    existingLabels,
    floorInstance,
    selectedFloorElement,
} = defineProps<Props>();

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
const getElementAngle = computed(() => (selectedFloorElement ? selectedFloorElement.angle : 0));

const localWidth = ref(getElementWidth.value);
const localHeight = ref(getElementHeight.value);
const localAngle = ref(getElementAngle.value);
const localLeft = ref(selectedFloorElement ? Math.round(selectedFloorElement.left) : 0);
const localTop = ref(selectedFloorElement ? Math.round(selectedFloorElement.top) : 0);
const elementColor = ref(selectedFloorElement?.getBaseFill?.() ?? "");

watch(
    () => selectedFloorElement,
    function (newEl) {
        localWidth.value = newEl ? Math.round(newEl.width * newEl.scaleX) : 0;
        localHeight.value = newEl ? Math.round(newEl.height * newEl.scaleY) : 0;
        localAngle.value = newEl ? newEl.angle : 0;
        localLeft.value = newEl ? Math.round(newEl.left) : 0;
        localTop.value = newEl ? Math.round(newEl.top) : 0;

        if (newEl?.getBaseFill) {
            elementColor.value = newEl.getBaseFill();
        }
    },
    { immediate: true },
);

watch([localLeft, localTop], ([newLeft, newTop]) => {
    if (!selectedFloorElement) return;
    setElementPosition(selectedFloorElement, newLeft, newTop);
});

watch(localAngle, function (newAngle) {
    if (!selectedFloorElement) return;
    setElementAngle(selectedFloorElement, newAngle);
});

watch(localWidth, function (newWidth) {
    if (!selectedFloorElement) {
        return;
    }
    setDimensions(selectedFloorElement, { height: localHeight.value, width: newWidth });
});

watch(localHeight, function (newHeight) {
    if (!selectedFloorElement) {
        return;
    }
    setDimensions(selectedFloorElement, { height: newHeight, width: localWidth.value });
});

function sendBack(): void {
    selectedFloorElement?.canvas?.sendObjectBackwards(selectedFloorElement);
}

const setElementColor = debounce(function (newVal: unknown): void {
    if (!isString(newVal)) {
        return;
    }
    elementColor.value = newVal;
    floorInstance.setElementFill(selectedFloorElement, newVal);
}, 300);

async function deleteElement(): Promise<void> {
    if (!selectedFloorElement) {
        return;
    }
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement);
    }
}

function onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === "Delete" && selectedFloorElement) {
        deleteElement();
    }
}

function updateTableLabel(tableEl: FloorEditorElement | undefined, newLabel: unknown): void {
    if (!isString(newLabel) || !isTable(tableEl)) {
        return;
    }
    if (existingLabels.has(newLabel)) {
        showErrorMessage("Table Id already taken");
        return;
    }
    tableEl.setLabel(newLabel);
}

onMounted(function () {
    useEventListener("keydown", onKeyDownListener);
});
</script>

<template>
    <div class="row FloorEditorTopControls q-gutter-xs">
        <!-- Position Coordinates -->
        <div class="col-1">
            <q-input standout v-model.number="localLeft" type="number" label="X" />
        </div>
        <div class="col-1">
            <q-input standout v-model.number="localTop" type="number" label="Y" />
        </div>

        <div class="col-1">
            <q-input standout v-model.number="localWidth" type="number" label="Width" />
        </div>
        <div class="col-1">
            <q-input standout v-model.number="localHeight" type="number" label="Height" />
        </div>

        <!-- Angle Control -->
        <div class="col-1">
            <q-input standout v-model.number="localAngle" type="number" label="Angle°" />
        </div>

        <div class="col-2" v-if="isTable(selectedFloorElement)">
            <q-input
                :debounce="500"
                :model-value="selectedFloorElement.label"
                @update:model-value="(newLabel) => updateTableLabel(selectedFloorElement, newLabel)"
                type="text"
                standout
                label="Table label"
            />
        </div>

        <q-space />

        <div class="col-auto flex q-gutter-xs q-ma-none">
            <FTColorPickerButton
                :model-value="elementColor"
                @update:model-value="setElementColor"
            />

            <q-btn
                flat
                title="Send back"
                v-if="deleteAllowed"
                icon="send-backward"
                @click="sendBack"
            />
            <q-btn
                flat
                title="Copy element"
                icon="copy"
                @click="floorInstance.copySelectedElement()"
            />
            <q-btn
                flat
                v-if="'flip' in selectedFloorElement"
                title="Flip element"
                icon="transfer"
                @click="selectedFloorElement.flip()"
            />

            <q-btn
                flat
                v-if="'nextDesign' in selectedFloorElement"
                title="Switch to fill element"
                icon="chevron_right"
                @click="selectedFloorElement.nextDesign()"
            />

            <q-btn
                unelevated
                title="Delete element"
                v-if="deleteAllowed"
                icon="trash"
                color="negative"
                @click="deleteElement"
            />
        </div>
    </div>
</template>
