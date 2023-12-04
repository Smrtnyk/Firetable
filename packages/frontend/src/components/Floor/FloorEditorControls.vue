<script setup lang="ts">
import type { BaseTable, FloorEditorElement } from "@firetable/floor-creator";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from "vue";
import { isTable } from "@firetable/floor-creator";
import { QPopupProxy } from "quasar";
import { isMobile, isTablet } from "src/global-reactives/screen-detection";

interface Props {
    selectedFloorElement: FloorEditorElement | undefined;
    deleteAllowed?: boolean;
    existingLabels: Set<string>;
}

const props = withDefaults(defineProps<Props>(), {
    deleteAllowed: true,
});
const { selectedFloorElement, deleteAllowed, existingLabels } = toRefs(props);
const emit = defineEmits(["delete"]);
const colorPickerProxy = ref<QPopupProxy | null>(null);
const getElementWidth = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.width * el.scaleX) : 0;
});

const getElementHeight = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.height * el.scaleY) : 0;
});

const localWidth = ref(getElementWidth.value);
const localHeight = ref(getElementHeight.value);
const elementColor = ref("");

function onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === "Delete" && selectedFloorElement.value) {
        deleteElement();
    }
}

onMounted(() => {
    document.addEventListener("keydown", onKeyDownListener);
});

onBeforeUnmount(() => {
    document.removeEventListener("keydown", onKeyDownListener);
});

watch(selectedFloorElement, (newEl) => {
    localWidth.value = newEl ? Math.round(newEl.width * newEl.scaleX) : 0;
    localHeight.value = newEl ? Math.round(newEl.height * newEl.scaleY) : 0;

    if (newEl?.getBaseFill) {
        elementColor.value = newEl.getBaseFill();
    }
});

watch(localWidth, (newWidth) => {
    if (!selectedFloorElement.value) {
        return;
    }
    selectedFloorElement.value.scaleX = newWidth / selectedFloorElement.value.width;
    selectedFloorElement.value.setCoords();
    selectedFloorElement.value.canvas?.renderAll();
});

watch(localHeight, (newHeight) => {
    if (!selectedFloorElement.value) {
        return;
    }
    selectedFloorElement.value.scaleY = newHeight / selectedFloorElement.value.height;
    selectedFloorElement.value.setCoords();
    selectedFloorElement.value.canvas?.renderAll();
});

watch(selectedFloorElement, (newEl) => {
    if (newEl?.getBaseFill) {
        elementColor.value = newEl.getBaseFill();
    }
});

function openColorPicker(): void {
    colorPickerProxy.value?.show();
}

function updateTableLabel(tableEl: BaseTable, newLabel: string): void {
    if (!newLabel) {
        return;
    }
    if (existingLabels.value.has(newLabel)) {
        showErrorMessage("Table Id already taken");
        return;
    }
    tableEl.setLabel(newLabel);
}

async function deleteElement(): Promise<void> {
    if (!selectedFloorElement.value) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement.value);
    }
}

function setElementColor(newVal: any): void {
    elementColor.value = newVal;
    selectedFloorElement.value?.setBaseFill?.(newVal);
}
</script>

<template>
    <div v-if="!isTablet" class="ShowSelectedElement">
        <q-card
            class="ShowSelectedElement__floating-controls row q-gutter-xs q-ma-xs q-pa-xs q-pt-md q-pb-md justify-around items-center"
        >
            <slot name="buttons"></slot>
            <div class="row justify-around q-gutter-xs" v-if="selectedFloorElement">
                <q-separator inset class="q-ma-md full-width"></q-separator>
                <p>Element</p>
                <q-input
                    v-model="localWidth"
                    standout
                    rounded
                    type="number"
                    label="Width"
                    class="q-ma-xs"
                />
                <q-input
                    rounded
                    v-model="localHeight"
                    standout
                    type="number"
                    label="Height"
                    class="q-ma-xs"
                />
                <q-input
                    v-if="isTable(selectedFloorElement)"
                    class="q-ma-xs"
                    :debounce="500"
                    :model-value="selectedFloorElement.label"
                    @update:model-value="
                        (newLabel) =>
                            updateTableLabel(selectedFloorElement as BaseTable, newLabel as string)
                    "
                    type="text"
                    standout
                    rounded
                    label="Table label"
                />
                <q-btn
                    title="Change element fill color"
                    v-if="elementColor"
                    :style="{ 'background-color': elementColor }"
                    @click="openColorPicker"
                    round
                >
                    <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                    <q-popup-proxy
                        no-parent-event
                        ref="colorPickerProxy"
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                    >
                        <q-color
                            :model-value="elementColor"
                            @update:model-value="setElementColor"
                        />
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
            </div>
        </q-card>
    </div>
    <div v-else>
        <div v-if="selectedFloorElement && isTablet" class="row">
            <div class="col-md-6 col-12 row q-gutter-xs">
                <div class="col">
                    <q-input
                        :dense="isMobile"
                        v-model="localWidth"
                        standout
                        rounded
                        type="number"
                        label="Width"
                    />
                </div>
                <div class="col">
                    <q-input
                        rounded
                        :dense="isMobile"
                        v-model="localHeight"
                        standout
                        type="number"
                        label="Height"
                    />
                </div>
                <div class="col" v-if="isTable(selectedFloorElement)">
                    <q-input
                        :debounce="500"
                        :model-value="selectedFloorElement.label"
                        @update:model-value="
                            (newLabel) =>
                                updateTableLabel(
                                    selectedFloorElement as BaseTable,
                                    newLabel as string,
                                )
                        "
                        type="text"
                        standout
                        rounded
                        label="Table label"
                        :dense="isMobile"
                    />
                </div>
            </div>

            <div class="col-md-6 col-12 row justify-md-end q-mt-sm q-mt-md-none">
                <!-- Color Picker Button -->
                <q-btn
                    title="Change element fill color"
                    v-if="elementColor"
                    :style="{ 'background-color': elementColor }"
                    @click="openColorPicker"
                >
                    <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                    <q-popup-proxy
                        no-parent-event
                        ref="colorPickerProxy"
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                    >
                        <q-color
                            :model-value="elementColor"
                            @update:model-value="setElementColor"
                        />
                    </q-popup-proxy>
                </q-btn>

                <!-- Delete Button -->
                <q-btn
                    title="Delete element"
                    v-if="deleteAllowed"
                    icon="trash"
                    color="negative"
                    @click="deleteElement"
                />
                <slot name="buttons"></slot>
            </div>
        </div>

        <div v-else class="row">
            <div class="col-md-6 col-12">
                <q-input
                    :dense="isMobile"
                    model-value="No element selected..."
                    disable
                    readonly
                    standout
                    rounded
                    autogrow
                />
            </div>
            <div class="col-md-6 col-12 row justify-md-end q-mt-sm q-mt-md-none">
                <slot name="buttons"></slot>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.ShowSelectedElement {
    &__floating-controls {
        max-width: 140px;
        position: absolute;
        left: 0;
        top: 10%;
    }
}
</style>
