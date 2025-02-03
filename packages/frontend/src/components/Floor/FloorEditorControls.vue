<script setup lang="ts">
import type { FloorEditor, FloorEditorElement, FloorElementTypes } from "@firetable/floor-creator";

import { MAX_FLOOR_HEIGHT, MAX_FLOOR_WIDTH, RESOLUTION } from "@firetable/floor-creator";
import { isString } from "es-toolkit";
import { isNumber } from "es-toolkit/compat";
import { exportFile } from "quasar";
import FTColorPickerButton from "src/components/FTColorPickerButton.vue";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { showConfirm } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger.js";
import { onMounted, reactive, ref, useTemplateRef } from "vue";

interface EmitEvents {
    (e: "delete", element: FloorEditorElement): void;
    (e: "floorUpdate", value: { height?: number; name?: string; width?: number }): void;
    (e: "floorSave"): void;
}

interface Props {
    canSave: boolean;
    floorInstance: FloorEditor;
}

const { canSave, floorInstance } = defineProps<Props>();
const emit = defineEmits<EmitEvents>();

const floorInstanceState = reactive({
    canRedo: false,
    canUndo: false,
    height: floorInstance.height,
    width: floorInstance.width,
});

onMounted(function () {
    floorInstance.on("historyChange", function () {
        floorInstanceState.canUndo = floorInstance.canUndo();
        floorInstanceState.canRedo = floorInstance.canRedo();
        floorInstanceState.width = floorInstance.width;
        floorInstanceState.height = floorInstance.height;
    });
});

async function exportFloor(floorVal: FloorEditor): Promise<void> {
    if (!(await showConfirm("Do you want to export this floor plan?"))) {
        return;
    }
    exportFile(`${floorVal.name}.json`, JSON.stringify(floorVal.export()));
}

function redoAction(): void {
    if (!floorInstance) {
        return;
    }
    floorInstance.redo();
    floorInstance.canvas.renderAll();
}

function undoAction(): void {
    if (!floorInstance) {
        return;
    }
    floorInstance.undo();
    floorInstance.canvas.renderAll();
}
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInputRef");

function onDragStart(event: DragEvent, item: FloorElementTypes): void {
    event.dataTransfer?.setData(
        "text/plain",
        JSON.stringify({
            item,
            type: "floor-element",
        }),
    );
}

function onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", function () {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (floorInstance) {
                floorInstance.importFloor(jsonData).catch(AppLogger.error.bind(AppLogger));
            }
        });
        reader.readAsText(file);
    }
}

function onFloorChange(prop: keyof FloorEditor, event: null | number | string): void {
    emit("floorUpdate", { [prop]: event });
}

function onFloorSave(): void {
    emit("floorSave");
}

function triggerFileInput(): void {
    fileInputRef.value?.click();
}

const bgColor = ref(floorInstance.getBackgroundColor());
const isDrawingMode = ref(false);
const lineWidth = ref(2);
const drawingColor = ref("#000000");
const selectedBrushType = ref<"circle" | "pencil" | "spray">("pencil");
const brushSettingsOpen = ref(false);

const brushOptions = [
    { label: "Pencil", value: "pencil" },
    { label: "Spray", value: "spray" },
    { label: "Circle", value: "circle" },
];

function openBrushSettings(): void {
    brushSettingsOpen.value = true;
}

function toggleDrawingMode(): void {
    isDrawingMode.value = !isDrawingMode.value;
    floorInstance.setDrawingMode(isDrawingMode.value);
}

function updateBgColor(color: string): void {
    bgColor.value = color;
    floorInstance.setBackgroundColor(color);
}

function updateBrushColor(color: unknown): void {
    if (!isString(color)) {
        return;
    }
    drawingColor.value = color;
    floorInstance.setBrushColor(color);
}

function updateBrushType(newBrushType: "circle" | "pencil" | "spray"): void {
    floorInstance.setBrushType(newBrushType);
}

function updateLineWidth(width: unknown): void {
    if (!isNumber(width)) {
        return;
    }

    floorInstance.setBrushWidth(width);
}
</script>

<template>
    <q-card
        class="FloorEditorControls row q-gutter-xs q-pa-xs q-pt-md q-pb-md justify-around ft-card"
    >
        <div class="row items-center justify-around q-col-gutter-xs q-pa-xs">
            <q-btn
                :disabled="!canSave"
                class="button-gradient"
                icon="save"
                @click="onFloorSave"
                label="save"
                rounded
            />
            <input
                ref="fileInputRef"
                type="file"
                @change="onFileSelected"
                style="display: none"
                accept=".json"
            />

            <q-input
                standout
                label="Floor name"
                @update:model-value="(event) => onFloorChange('name', event)"
                :model-value="floorInstance.name"
                class="full-width"
            />

            <q-input
                @keydown.prevent
                :min="300"
                :max="MAX_FLOOR_WIDTH"
                :step="RESOLUTION"
                :model-value="floorInstanceState.width"
                @update:model-value="(event) => onFloorChange('width', event)"
                standout
                type="number"
                label="Floor width"
                class="col-6"
            />
            <q-input
                @keydown.prevent
                :min="300"
                :max="MAX_FLOOR_HEIGHT"
                :step="RESOLUTION"
                @update:model-value="(event) => onFloorChange('height', event)"
                :model-value="floorInstanceState.height"
                standout
                type="number"
                label="Floor height"
                class="col-6"
            />

            <div class="row justify-between">
                <q-btn
                    flat
                    padding="md"
                    title="Undo"
                    :disabled="!floorInstanceState.canUndo"
                    @click="undoAction"
                    icon="undo"
                />
                <q-btn
                    flat
                    padding="md"
                    title="Redo"
                    :disabled="!floorInstanceState.canRedo"
                    @click="redoAction"
                    icon="redo"
                />

                <q-btn
                    flat
                    padding="md"
                    title="Toggle grid"
                    @click="floorInstance.toggleGridVisibility"
                    icon="grid"
                />
                <q-btn
                    flat
                    padding="md"
                    icon="download"
                    title="Export floor plan"
                    @click="exportFloor(floorInstance as FloorEditor)"
                />
                <q-btn
                    flat
                    padding="md"
                    title="Import floor plan"
                    icon="import"
                    @click="triggerFileInput"
                />
            </div>
        </div>

        <!-- Drawing Controls -->
        <div class="q-pa-md row items-center">
            <div class="q-mr-sm">
                <FTColorPickerButton
                    round
                    :model-value="bgColor"
                    @update:model-value="updateBgColor"
                />
            </div>

            <q-btn
                flat
                round
                icon="pencil"
                :color="isDrawingMode ? 'negative' : ''"
                @click="toggleDrawingMode"
                class="q-mr-sm"
            />

            <q-btn
                round
                flat
                icon="cog-wheel"
                @click="openBrushSettings"
                :disabled="!isDrawingMode"
            />

            <!-- Popup with brush controls -->
            <q-popup-proxy
                v-model="brushSettingsOpen"
                transition-show="scale"
                transition-hide="scale"
                no-parent-event
                cover
                class="ft-card"
            >
                <div style="min-width: 280px">
                    <q-card-section class="q-pa-sm">
                        <q-select
                            v-model="selectedBrushType"
                            :options="brushOptions"
                            @update:model-value="updateBrushType"
                            label="Brush Type"
                            standout
                            rounded
                            dense
                            emit-value
                        />
                    </q-card-section>

                    <!-- Color Picker -->
                    <q-card-section class="q-pa-sm">
                        <div class="column items-start q-gutter-sm">
                            <span class="text-caption">Color</span>

                            <FTColorPickerButton
                                :model-value="drawingColor"
                                @update:model-value="updateBrushColor"
                                round
                            />
                        </div>
                    </q-card-section>

                    <!-- Line Width -->
                    <q-card-section class="q-pa-sm">
                        <div class="row items-center q-col-gutter-sm">
                            <span class="text-caption">Brush Size</span>
                            <q-slider
                                v-model.number="lineWidth"
                                :min="1"
                                :max="50"
                                :step="1"
                                label
                                @update:model-value="updateLineWidth"
                            />
                        </div>
                    </q-card-section>
                </div>
            </q-popup-proxy>
        </div>

        <!-- Add Element -->
        <q-separator inset />

        <div class="row items-center justify-around">
            <div
                draggable="true"
                v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                :key="element.tag"
                class="col-5 justify-even text-center q-my-sm ft-border q-py-sm"
                @dragstart="onDragStart($event, element.tag)"
            >
                <p>{{ element.label }}</p>

                <q-avatar square size="42px">
                    <img v-if="element.img" :src="element.img" alt="Floor element" />
                    <p v-else>{{ element.label }}</p>
                </q-avatar>
            </div>
        </div>
    </q-card>
</template>

<style lang="scss">
.FloorEditorControls {
    .element-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        grid-template-areas:
            "full1"
            "full2"
            "full3"
            "buttons";
        gap: 2%;
    }

    .full1 {
        grid-area: full1;
    }

    .full2 {
        grid-area: full2;
    }

    .full3 {
        grid-area: full3;
    }

    .buttons {
        grid-area: buttons;
        justify-self: center;
        align-self: center;
        text-align: center;
    }
}
</style>
