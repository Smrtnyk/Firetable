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
import { onMounted, reactive, ref } from "vue";

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
    if (!(await globalDialog.confirm({ title: "Do you want to export this floor plan?" }))) {
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
const fileInputRef = ref<HTMLInputElement | null>(null);

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
    <v-card class="floor-editor-controls ft-card pa-2">
        <div class="d-flex flex-column" style="gap: 16px">
            <div>
                <v-btn
                    :disabled="!canSave"
                    class="button-gradient mb-4"
                    prepend-icon="fas fa-save"
                    @click="onFloorSave"
                    block
                >
                    Save
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
                    density="compact"
                    label="Floor name"
                    :model-value="floorInstance.name"
                    @update:model-value="(event) => onFloorChange('name', event)"
                    class="mb-2"
                    hide-details
                />

                <v-row dense>
                    <v-col>
                        <v-text-field
                            @keydown.prevent
                            :min="300"
                            :max="MAX_FLOOR_WIDTH"
                            :step="RESOLUTION"
                            :model-value="floorInstanceState.width"
                            @update:model-value="(event) => onFloorChange('width', event)"
                            variant="outlined"
                            density="compact"
                            type="number"
                            label="Floor width"
                            hide-details
                        />
                    </v-col>
                    <v-col>
                        <v-text-field
                            @keydown.prevent
                            :min="300"
                            :max="MAX_FLOOR_HEIGHT"
                            :step="RESOLUTION"
                            @update:model-value="(event) => onFloorChange('height', event)"
                            :model-value="floorInstanceState.height"
                            variant="outlined"
                            density="compact"
                            type="number"
                            label="Floor height"
                            hide-details
                        />
                    </v-col>
                </v-row>

                <div class="d-flex justify-space-around mt-2">
                    <v-btn
                        variant="text"
                        size="small"
                        icon="fas fa-undo"
                        title="Undo"
                        :disabled="!floorInstanceState.canUndo"
                        @click="undoAction"
                    />
                    <v-btn
                        variant="text"
                        size="small"
                        icon="fas fa-redo"
                        title="Redo"
                        :disabled="!floorInstanceState.canRedo"
                        @click="redoAction"
                    />
                    <v-btn
                        variant="text"
                        size="small"
                        icon="fas fa-th"
                        title="Toggle grid"
                        @click="floorInstance.toggleGridVisibility"
                    />
                    <v-btn
                        variant="text"
                        size="small"
                        icon="fas fa-file-export"
                        title="Export floor plan"
                        @click="exportFloor(floorInstance as FloorEditor)"
                    />
                    <v-btn
                        variant="text"
                        size="small"
                        icon="fas fa-file-import"
                        title="Import floor plan"
                        @click="triggerFileInput"
                    />
                </div>
            </div>

            <div class="d-flex align-center" style="gap: 8px">
                <span>Background:</span>
                <FTColorPickerButton
                    size="sm"
                    :model-value="bgColor"
                    @update:model-value="updateBgColor"
                />
                <v-spacer />

                <v-btn
                    variant="text"
                    size="small"
                    icon="fas fa-paint-brush"
                    :color="isDrawingMode ? 'error' : 'default'"
                    @click="toggleDrawingMode"
                    title="Toggle Drawing Mode"
                />
                <v-menu v-model="brushSettingsOpen" :close-on-content-click="false" location="end">
                    <template #activator="{ props }">
                        <v-btn
                            variant="text"
                            size="small"
                            icon="fas fa-cog"
                            v-bind="props"
                            :disabled="!isDrawingMode"
                            title="Brush Settings"
                        />
                    </template>
                    <v-card class="ft-card" width="280">
                        <div class="pa-2 d-flex flex-column" style="gap: 12px">
                            <v-select
                                v-model="selectedBrushType"
                                :items="brushOptions"
                                item-title="label"
                                item-value="value"
                                @update:model-value="updateBrushType"
                                label="Brush Type"
                                variant="outlined"
                                density="compact"
                                hide-details
                            />
                            <div class="d-flex align-center">
                                <span class="text-caption mr-2">Color:</span>
                                <FTColorPickerButton
                                    size="sm"
                                    :model-value="drawingColor"
                                    @update:model-value="updateBrushColor"
                                />
                            </div>
                            <div>
                                <div class="text-caption">Brush Size: {{ lineWidth }}px</div>
                                <v-slider
                                    v-model="lineWidth"
                                    :min="1"
                                    :max="50"
                                    :step="1"
                                    @update:model-value="updateLineWidth"
                                    density="compact"
                                    hide-details
                                />
                            </div>
                        </div>
                    </v-card>
                </v-menu>
            </div>

            <v-divider />

            <div>
                <div class="text-subtitle-2 text-center mb-2">Drag to add</div>
                <v-row dense>
                    <v-col
                        v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                        :key="element.tag"
                        cols="6"
                    >
                        <div
                            draggable="true"
                            class="text-center pa-2 ft-border"
                            style="cursor: grab"
                            @dragstart="onDragStart($event, element.tag)"
                        >
                            <v-avatar rounded="0" size="42">
                                <v-img v-if="element.img" :src="element.img" :alt="element.label" />
                                <span v-else class="text-caption">{{ element.label }}</span>
                            </v-avatar>
                            <div class="text-caption mt-1">{{ element.label }}</div>
                        </div>
                    </v-col>
                </v-row>
            </div>
        </div>
    </v-card>
</template>
