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
import { globalDialog } from "src/composables/useDialog";
import { showErrorMessage } from "src/helpers/ui-helpers";
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
    if (await globalDialog.confirm({ title: "Do you really want to delete this element?" })) {
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
    <div class="d-flex align-center pa-2" style="gap: 8px">
        <!-- Position Coordinates -->
        <v-text-field
            v-model.number="localLeft"
            type="number"
            label="X"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 80px"
        />
        <v-text-field
            v-model.number="localTop"
            type="number"
            label="Y"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 80px"
        />

        <!-- Dimensions -->
        <v-text-field
            v-model.number="localWidth"
            type="number"
            label="Width"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 90px"
        />
        <v-text-field
            v-model.number="localHeight"
            type="number"
            label="Height"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 90px"
        />

        <!-- Angle Control -->
        <v-text-field
            v-model.number="localAngle"
            type="number"
            label="Angle°"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 90px"
        />

        <!-- Table Label Input -->
        <v-text-field
            v-if="isTable(selectedFloorElement)"
            :model-value="selectedFloorElement.label"
            @update:model-value="(newLabel) => updateTableLabel(selectedFloorElement, newLabel)"
            type="text"
            label="Table label"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 150px"
        />

        <v-spacer />

        <div class="d-flex align-center" style="gap: 4px">
            <FTColorPickerButton
                :model-value="elementColor"
                @update:model-value="setElementColor"
            />

            <v-btn
                v-if="deleteAllowed"
                variant="text"
                icon="fas fa-level-down-alt"
                title="Send back"
                @click="sendBack"
            />
            <v-btn
                variant="text"
                icon="far fa-copy"
                title="Copy element"
                @click="floorInstance.copySelectedElement()"
            />
            <v-btn
                v-if="'flip' in selectedFloorElement"
                variant="text"
                icon="fas fa-arrows-alt-h"
                title="Flip element"
                @click="selectedFloorElement.flip()"
            />
            <v-btn
                v-if="'nextDesign' in selectedFloorElement"
                variant="text"
                icon="fas fa-chevron-right"
                title="Switch to fill element"
                @click="selectedFloorElement.nextDesign()"
            />
            <v-btn
                v-if="deleteAllowed"
                variant="flat"
                color="error"
                icon="fas fa-trash-alt"
                title="Delete element"
                @click="deleteElement"
            />
        </div>
    </div>
</template>
