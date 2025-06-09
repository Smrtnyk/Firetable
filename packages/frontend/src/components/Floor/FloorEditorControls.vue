<script setup lang="ts">
import type { FloorEditor, FloorEditorElement, FloorElementTypes } from "@firetable/floor-creator";

import { MAX_FLOOR_HEIGHT, MAX_FLOOR_WIDTH, RESOLUTION } from "@firetable/floor-creator";
import { isString } from "es-toolkit";
import { isNumber } from "es-toolkit/compat";
import FTColorPickerButton from "src/components/FTColorPickerButton.vue";
import { globalDialog } from "src/composables/useDialog";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { exportFile } from "src/helpers/export-file";
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
    if (!(await globalDialog.confirmTitle("Do you want to export this floor plan?"))) {
        return;
    }
    exportFile(JSON.stringify(floorVal.export()), `${floorVal.name}.json`);
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
    { title: "Pencil", value: "pencil" },
    { title: "Spray", value: "spray" },
    { title: "Circle", value: "circle" },
];

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
    <v-card class="FloorEditorControls pa-2 pt-4 pb-4 ft-card">
        <v-row class="ga-2 justify-space-around">
            <v-col cols="12">
                <div class="d-flex align-center justify-space-around ga-2 pa-2">
                    <v-btn flat :disabled="!canSave" color="primary" rounded @click="onFloorSave">
                        <v-icon start>fas fa-save</v-icon>
                        save
                    </v-btn>

                    <input
                        ref="fileInputRef"
                        type="file"
                        @change="onFileSelected"
                        style="display: none"
                        accept=".json"
                    />

                    <v-text-field
                        variant="outlined"
                        label="Floor name"
                        :model-value="floorInstance.name"
                        @update:model-value="(event) => onFloorChange('name', event)"
                        class="flex-grow-1"
                    />

                    <v-text-field
                        variant="outlined"
                        type="number"
                        label="Floor width"
                        :min="300"
                        :max="MAX_FLOOR_WIDTH"
                        :step="RESOLUTION"
                        :model-value="floorInstanceState.width"
                        @update:model-value="(event) => onFloorChange('width', event)"
                        style="min-width: 140px"
                    />

                    <v-text-field
                        variant="outlined"
                        type="number"
                        label="Floor height"
                        :min="300"
                        :max="MAX_FLOOR_HEIGHT"
                        :step="RESOLUTION"
                        :model-value="floorInstanceState.height"
                        @update:model-value="(event) => onFloorChange('height', event)"
                        style="min-width: 140px"
                    />

                    <div class="d-flex justify-space-between">
                        <v-btn
                            variant="text"
                            :disabled="!floorInstanceState.canUndo"
                            @click="undoAction"
                            title="Undo"
                        >
                            <v-icon>fas fa-undo</v-icon>
                        </v-btn>

                        <v-btn
                            variant="text"
                            :disabled="!floorInstanceState.canRedo"
                            @click="redoAction"
                            title="Redo"
                        >
                            <v-icon>fas fa-redo</v-icon>
                        </v-btn>

                        <v-btn
                            variant="text"
                            @click="floorInstance.toggleGridVisibility"
                            title="Toggle grid"
                        >
                            <v-icon>fas fa-th</v-icon>
                        </v-btn>

                        <v-btn
                            variant="text"
                            @click="exportFloor(floorInstance as FloorEditor)"
                            title="Export floor plan"
                        >
                            <v-icon>fas fa-file-export</v-icon>
                        </v-btn>

                        <v-btn variant="text" @click="triggerFileInput" title="Import floor plan">
                            <v-icon>fas fa-file-import</v-icon>
                        </v-btn>
                    </div>
                </div>
            </v-col>

            <!-- Drawing Controls -->
            <v-col cols="12">
                <div class="pa-4 d-flex align-center">
                    <div class="me-2">
                        <FTColorPickerButton
                            :model-value="bgColor"
                            @update:model-value="updateBgColor"
                        />
                    </div>

                    <v-btn
                        variant="text"
                        icon
                        :color="isDrawingMode ? 'error' : ''"
                        @click="toggleDrawingMode"
                        class="me-2"
                    >
                        <v-icon>fas fa-paint-brush</v-icon>
                    </v-btn>

                    <v-menu v-model="brushSettingsOpen" :close-on-content-click="false">
                        <template #activator="{ props }">
                            <v-btn icon variant="text" :disabled="!isDrawingMode" v-bind="props">
                                <v-icon>fas fa-cog</v-icon>
                            </v-btn>
                        </template>

                        <v-card style="min-width: 280px">
                            <v-card-text class="pa-2">
                                <v-select
                                    v-model="selectedBrushType"
                                    :items="brushOptions"
                                    @update:model-value="updateBrushType"
                                    label="Brush Type"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-card-text>

                            <!-- Color Picker -->
                            <v-card-text class="pa-2">
                                <div class="d-flex flex-column align-start ga-2">
                                    <span class="text-caption">Color</span>
                                    <FTColorPickerButton
                                        :model-value="drawingColor"
                                        @update:model-value="updateBrushColor"
                                    />
                                </div>
                            </v-card-text>

                            <!-- Line Width -->
                            <v-card-text class="pa-2">
                                <div class="d-flex align-center ga-2">
                                    <span class="text-caption">Brush Size</span>
                                    <v-slider
                                        v-model.number="lineWidth"
                                        :min="1"
                                        :max="50"
                                        :step="1"
                                        show-ticks
                                        @update:model-value="updateLineWidth"
                                    />
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
            </v-col>

            <!-- Add Element -->
            <v-col cols="12">
                <v-divider />
            </v-col>

            <v-col cols="12">
                <v-row class="justify-space-around">
                    <v-col
                        cols="5"
                        v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                        :key="element.tag"
                        draggable="true"
                        class="text-center my-2 py-2"
                        @dragstart="onDragStart($event, element.tag)"
                    >
                        <p>{{ element.label }}</p>
                        <v-avatar size="42" variant="flat">
                            <v-img v-if="element.img" :src="element.img" alt="Floor element" />
                            <span v-else>{{ element.label }}</span>
                        </v-avatar>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
    </v-card>
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
