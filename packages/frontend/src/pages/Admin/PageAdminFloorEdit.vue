<script setup lang="ts">
import type { FloorElementTypes } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";

import {
    extractAllTablesLabels,
    isTable,
    MAX_FLOOR_HEIGHT,
    MAX_FLOOR_WIDTH,
    RESOLUTION,
    setDimensions,
    setElementAngle,
    setElementPosition,
} from "@firetable/floor-creator";
import { useEventListener } from "@vueuse/core";
import { debounce, isString } from "es-toolkit";
import { isNumber } from "es-toolkit/compat";
import FloorGeneratorAIPrompt from "src/components/Floor/FloorGeneratorAIPrompt.vue";
import FTColorPickerButton from "src/components/FTColorPickerButton.vue";
import { globalDialog } from "src/composables/useDialog";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { getFloorPath } from "src/db";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { exportFile } from "src/helpers/export-file";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger.js";
import { useGlobalStore } from "src/stores/global";
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";

interface Props {
    floorId: string;
    organisationId: string;
    propertyId: string;
}

const { isTablet } = useScreenDetection();
const props = defineProps<Props>();
const router = useRouter();
const globalStore = useGlobalStore();
const canvasRef = useTemplateRef<HTMLCanvasElement | undefined>("canvasRef");
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInputRef");

const floorPath = getFloorPath(props.organisationId, props.propertyId, props.floorId);
const {
    data: floor,
    pending: isFloorLoading,
    promise: floorDataPromise,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });
const {
    floorInstance,
    hasChanges,
    initializeFloor,
    onDeleteElement,
    onFloorChange,
    resizeFloor,
    selectedElement,
} = useFloorEditor(pageRef);

const floorInstanceState = reactive({
    canRedo: false,
    canUndo: false,
    height: 0,
    width: 0,
});

const bgColor = ref("#ffffff");
const lineWidth = ref(2);
const drawingColor = ref("#000000");
const selectedBrushType = ref<"circle" | "pencil" | "spray">("pencil");
const showPropertiesPanel = ref(true);
const selectedTool = ref<"add" | "draw" | "select">("select");

const brushOptions = [
    { icon: "fa fa-pencil", label: "Pencil", value: "pencil" },
    { icon: "fa fa-spray-can", label: "Spray", value: "spray" },
    { icon: "fa fa-circle", label: "Circle", value: "circle" },
];

const elementProperties = reactive({
    angle: 0,
    color: "",
    height: 0,
    label: "",
    left: 0,
    top: 0,
    width: 0,
});

const existingLabels = computed(function () {
    return floorInstance.value ? new Set(extractAllTablesLabels(floorInstance.value)) : new Set();
});

watch(selectedTool, (newTool) => {
    const isDrawing = newTool === "draw";
    floorInstance.value?.setDrawingMode(isDrawing);
});

watch(
    () => selectedElement.value,
    function (newEl) {
        if (!newEl) {
            return;
        }
        elementProperties.width = Math.round(newEl.width * newEl.scaleX);
        elementProperties.height = Math.round(newEl.height * newEl.scaleY);
        elementProperties.angle = newEl.angle || 0;
        elementProperties.left = Math.round(newEl.left);
        elementProperties.top = Math.round(newEl.top);
        elementProperties.color = newEl.getBaseFill?.() || "";
        elementProperties.label = isTable(newEl) ? newEl.label || "" : "";
    },
    { immediate: true },
);

watch(
    () => [elementProperties.left, elementProperties.top],
    function ([left, top]) {
        if (!selectedElement.value) return;
        setElementPosition(selectedElement.value, left, top);
    },
);

watch(
    () => elementProperties.angle,
    function (angle) {
        if (!selectedElement.value) return;
        setElementAngle(selectedElement.value, angle);
    },
);

watch(
    () => [elementProperties.width, elementProperties.height],
    function ([width, height]) {
        if (!selectedElement.value) return;
        setDimensions(selectedElement.value, { height, width });
    },
);

function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        onFloorSave();
    }
    if (event.key === "Delete" && selectedElement.value) {
        deleteSelectedElement();
    }
}

onMounted(async function () {
    globalStore.setLoading(true);
    await floorDataPromise.value;
    if (floor.value) {
        instantiateFloor(floor.value);
        useEventListener("resize", resizeFloor);
        useEventListener("keydown", onKeyDown);

        if (floorInstance.value) {
            bgColor.value = floorInstance.value.getBackgroundColor();
            floorInstanceState.height = floorInstance.value.height;
            floorInstanceState.width = floorInstance.value.width;

            floorInstance.value.on("historyChange", function () {
                if (!floorInstance.value) return;
                floorInstanceState.canUndo = floorInstance.value.canUndo();
                floorInstanceState.canRedo = floorInstance.value.canRedo();
                floorInstanceState.width = floorInstance.value.width;
                floorInstanceState.height = floorInstance.value.height;
            });
        }
    } else {
        router.replace("/").catch(showErrorMessage);
    }
    globalStore.setLoading(false);
});

async function exportFloor(): Promise<void> {
    if (
        !floorInstance.value ||
        !(await globalDialog.confirm({
            message: "",
            title: "Do you want to export this floor plan?",
        }))
    ) {
        return;
    }
    exportFile(`${floorInstance.value.name}.json`, JSON.stringify(floorInstance.value.export()));
}

function instantiateFloor(floorDoc: FloorDoc): void {
    if (!canvasRef.value || !pageRef.value) {
        return;
    }

    initializeFloor({
        canvasElement: canvasRef.value,
        floorDoc: decompressFloorDoc(floorDoc),
    });
}

function onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", function () {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (floorInstance.value) {
                floorInstance.value.importFloor(jsonData).catch(AppLogger.error.bind(AppLogger));
            }
        });
        reader.readAsText(file);
    }
}

async function onFloorSave(): Promise<void> {
    if (!floorInstance.value) {
        return;
    }

    const { name } = floorInstance.value;
    const { height, json, width } = floorInstance.value.export();

    await tryCatchLoadingWrapper({
        async hook() {
            await updateFirestoreDocument(getFirestoreDocument(floorPath), {
                height,
                json: compressFloorDoc(json),
                name,
                width,
            });
            floorInstance.value?.markAsSaved();
        },
    });
}

function redoAction(): void {
    if (!floorInstance.value) return;
    floorInstance.value.redo();
    floorInstance.value.canvas.renderAll();
}

function triggerFileInput(): void {
    fileInputRef.value?.click();
}

function undoAction(): void {
    if (!floorInstance.value) return;
    floorInstance.value.undo();
    floorInstance.value.canvas.renderAll();
}

function updateBgColor(color: string): void {
    bgColor.value = color;
    floorInstance.value?.setBackgroundColor(color);
}

function updateBrushColor(color: unknown): void {
    if (!isString(color)) return;
    drawingColor.value = color;
    floorInstance.value?.setBrushColor(color);
}

function updateBrushType(newBrushType: "circle" | "pencil" | "spray"): void {
    selectedBrushType.value = newBrushType;
    floorInstance.value?.setBrushType(newBrushType);
}

function updateLineWidth(width: unknown): void {
    if (!isNumber(width)) return;
    lineWidth.value = width;
    floorInstance.value?.setBrushWidth(width);
}

const setElementColor = debounce(function (newVal: unknown): void {
    if (!isString(newVal) || !selectedElement.value) return;
    elementProperties.color = newVal;
    floorInstance.value?.setElementFill(selectedElement.value, newVal);
}, 300);

async function deleteSelectedElement(): Promise<void> {
    if (!selectedElement.value) return;
    if (await globalDialog.confirm({ title: "Do you really want to delete this element?" })) {
        onDeleteElement(selectedElement.value);
    }
}

function onDragStart(event: DragEvent, item: FloorElementTypes): void {
    event.dataTransfer?.setData(
        "text/plain",
        JSON.stringify({
            item,
            type: "floor-element",
        }),
    );
}

function openAIDialog(): void {
    if (!floorInstance.value) {
        showErrorMessage("Floor instance is not initialized.");
        return;
    }

    const dialog = globalDialog.openDialog(
        FloorGeneratorAIPrompt,
        {
            floorInstance: floorInstance.value,
            onDone() {
                globalDialog.closeDialog(dialog);
            },
        },
        {
            title: "Read floor plan from image",
        },
    );
}

function sendBack(): void {
    selectedElement.value?.canvas?.sendObjectBackwards(selectedElement.value);
}

function updateTableLabel(newLabel: unknown): void {
    if (!isString(newLabel) || !isTable(selectedElement.value)) return;
    if (existingLabels.value.has(newLabel)) {
        showErrorMessage("Table ID already taken");
        return;
    }
    selectedElement.value.setLabel(newLabel);
}
</script>

<template>
    <div class="floor-planner-container" v-if="!isTablet">
        <!-- Top Toolbar -->
        <div class="top-toolbar">
            <div class="toolbar-section">
                <v-btn-toggle v-model="selectedTool" variant="text" mandatory>
                    <v-btn value="select" icon>
                        <v-icon icon="fas fa-mouse-pointer"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Select Tool</v-tooltip>
                    </v-btn>
                    <v-btn value="draw" icon>
                        <v-icon icon="fas fa-paint-brush"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Drawing Tool</v-tooltip>
                    </v-btn>
                    <v-btn value="add" icon>
                        <v-icon icon="far fa-plus-square"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Add Elements</v-tooltip>
                    </v-btn>
                </v-btn-toggle>

                <v-divider vertical inset class="mx-1" />

                <v-btn-group variant="text">
                    <v-btn icon @click="undoAction" :disabled="!floorInstanceState.canUndo">
                        <v-icon icon="fas fa-undo"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Undo</v-tooltip>
                    </v-btn>
                    <v-btn icon @click="redoAction" :disabled="!floorInstanceState.canRedo">
                        <v-icon icon="fas fa-redo"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Redo</v-tooltip>
                    </v-btn>
                </v-btn-group>

                <v-divider vertical inset class="mx-1" />

                <v-btn variant="text" icon @click="floorInstance?.toggleGridVisibility">
                    <v-icon icon="fas fa-th"></v-icon>
                    <v-tooltip activator="parent" location="bottom">Toggle Grid</v-tooltip>
                </v-btn>
            </div>

            <div class="toolbar-section">
                <v-text-field
                    density="compact"
                    variant="outlined"
                    :model-value="floorInstance?.name"
                    @update:model-value="(event) => onFloorChange({ name: event as string })"
                    placeholder="Floor Name"
                    class="floor-name-input"
                    hide-details
                />
            </div>

            <div class="toolbar-section">
                <v-btn-group variant="text">
                    <v-btn @click="openAIDialog">
                        <template #prepend>
                            <v-icon icon="fas fa-wand-magic-sparkles"></v-icon>
                        </template>
                        Generate from Image
                        <v-tooltip activator="parent" location="bottom"
                            >Generate floor plan from image using AI</v-tooltip
                        >
                    </v-btn>
                    <v-btn icon @click="triggerFileInput">
                        <v-icon icon="fas fa-file-import"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Import Floor</v-tooltip>
                    </v-btn>
                    <v-btn icon @click="exportFloor">
                        <v-icon icon="fas fa-file-export"></v-icon>
                        <v-tooltip activator="parent" location="bottom">Export Floor</v-tooltip>
                    </v-btn>
                </v-btn-group>

                <v-divider vertical inset class="mx-1" />

                <v-btn :disabled="!hasChanges" variant="flat" color="primary" @click="onFloorSave">
                    <template #prepend>
                        <v-icon icon="fas fa-save"></v-icon>
                    </template>
                    Save
                </v-btn>
            </div>
        </div>

        <input
            ref="fileInputRef"
            type="file"
            @change="onFileSelected"
            style="display: none"
            accept=".json"
        />

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Left Panel -->
            <div class="left-panel" :class="{ 'panel-collapsed': !showPropertiesPanel }">
                <div class="panel-header">
                    <div class="panel-title" v-if="showPropertiesPanel">Properties</div>
                    <v-btn
                        variant="text"
                        size="small"
                        @click="showPropertiesPanel = !showPropertiesPanel"
                    >
                        <v-icon>{{
                            showPropertiesPanel ? "fa fa-chevron-left" : "fa fa-chevron-right"
                        }}</v-icon>
                        <v-tooltip activator="parent" location="right">{{
                            showPropertiesPanel ? "Collapse Panel" : "Expand Panel"
                        }}</v-tooltip>
                    </v-btn>
                </div>

                <div v-if="showPropertiesPanel" class="panel-content">
                    <!-- Floor Properties -->
                    <div class="property-section">
                        <div class="section-title">Floor Settings</div>
                        <div class="property-row">
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                type="number"
                                label="Width"
                                :model-value="floorInstanceState.width"
                                @update:model-value="
                                    (event) => onFloorChange({ width: Number(event) })
                                "
                                :min="300"
                                :max="MAX_FLOOR_WIDTH"
                                :step="RESOLUTION"
                                @keydown.prevent
                                hide-details
                            />
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                type="number"
                                label="Height"
                                :model-value="floorInstanceState.height"
                                @update:model-value="
                                    (event) => onFloorChange({ height: Number(event) })
                                "
                                :min="300"
                                :max="MAX_FLOOR_HEIGHT"
                                :step="RESOLUTION"
                                @keydown.prevent
                                hide-details
                            />
                        </div>
                        <div class="property-row">
                            <div class="property-label">Background</div>
                            <FTColorPickerButton
                                :model-value="bgColor"
                                @update:model-value="updateBgColor"
                            />
                        </div>
                    </div>

                    <!-- Drawing Properties -->
                    <div class="property-section" v-if="selectedTool === 'draw'">
                        <div class="section-title">Drawing Settings</div>
                        <v-select
                            density="compact"
                            variant="outlined"
                            v-model="selectedBrushType"
                            :items="brushOptions"
                            @update:model-value="updateBrushType"
                            label="Brush Type"
                            item-title="label"
                            item-value="value"
                            hide-details
                            class="mb-2"
                        >
                            <template v-slot:item="{ props: itemPropsInternal, item }">
                                <v-list-item
                                    v-bind="itemPropsInternal"
                                    :prepend-icon="item.raw.icon"
                                    :title="item.raw.label"
                                ></v-list-item>
                            </template>
                        </v-select>
                        <div class="property-row">
                            <div class="property-label">Color</div>
                            <FTColorPickerButton
                                :model-value="drawingColor"
                                @update:model-value="updateBrushColor"
                            />
                        </div>
                        <div class="property-row">
                            <div class="property-label">Size</div>
                            <v-slider
                                v-model.number="lineWidth"
                                :min="1"
                                :max="50"
                                :step="1"
                                thumb-label
                                @update:model-value="updateLineWidth"
                                color="primary"
                                hide-details
                                density="compact"
                            />
                        </div>
                    </div>

                    <!-- Element Properties -->
                    <div class="property-section" v-if="selectedElement">
                        <div class="section-title">Element Properties</div>
                        <div class="property-grid">
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                v-model.number="elementProperties.left"
                                type="number"
                                label="X"
                                hide-details
                            />
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                v-model.number="elementProperties.top"
                                type="number"
                                label="Y"
                                hide-details
                            />
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                v-model.number="elementProperties.width"
                                type="number"
                                label="Width"
                                hide-details
                            />
                            <v-text-field
                                density="compact"
                                variant="outlined"
                                v-model.number="elementProperties.height"
                                type="number"
                                label="Height"
                                hide-details
                            />
                        </div>
                        <v-text-field
                            density="compact"
                            variant="outlined"
                            v-model.number="elementProperties.angle"
                            type="number"
                            label="Rotation"
                            suffix="°"
                            class="mt-2"
                            hide-details
                        />
                        <v-text-field
                            v-if="isTable(selectedElement)"
                            density="compact"
                            variant="outlined"
                            :model-value="elementProperties.label"
                            @update:model-value="updateTableLabel"
                            label="Table ID"
                            class="mt-2"
                            hide-details
                        />
                        <div class="property-row mt-2">
                            <div class="property-label">Color</div>
                            <FTColorPickerButton
                                :model-value="elementProperties.color"
                                @update:model-value="setElementColor"
                            />
                        </div>
                        <div class="element-actions mt-4">
                            <v-btn
                                variant="text"
                                density="compact"
                                icon="far fa-copy"
                                @click="floorInstance?.copySelectedElement()"
                            >
                                <v-tooltip activator="parent" location="bottom">Copy</v-tooltip>
                            </v-btn>
                            <v-btn
                                variant="text"
                                density="compact"
                                icon="fas fa-arrow-down"
                                @click="sendBack"
                            >
                                <v-tooltip activator="parent" location="bottom"
                                    >Send Back</v-tooltip
                                >
                            </v-btn>
                            <v-btn
                                v-if="'flip' in selectedElement"
                                variant="text"
                                density="compact"
                                icon="fas fa-arrows-alt-h"
                                @click="selectedElement.flip()"
                            >
                                <v-tooltip activator="parent" location="bottom">Flip</v-tooltip>
                            </v-btn>
                            <v-btn
                                v-if="'nextDesign' in selectedElement"
                                variant="text"
                                density="compact"
                                icon="fas fa-palette"
                                @click="selectedElement.nextDesign()"
                            >
                                <v-tooltip activator="parent" location="bottom"
                                    >Switch Design</v-tooltip
                                >
                            </v-btn>
                            <v-spacer />
                            <v-btn
                                variant="text"
                                density="compact"
                                icon="fas fa-trash-alt"
                                color="error"
                                @click="deleteSelectedElement"
                            >
                                <v-tooltip activator="parent" location="bottom">Delete</v-tooltip>
                            </v-btn>
                        </div>
                    </div>

                    <!-- Add Elements -->
                    <div class="property-section" v-if="selectedTool === 'add'">
                        <div class="section-title">Add Elements</div>
                        <div class="elements-grid">
                            <div
                                v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                                :key="element.tag"
                                class="element-item"
                                draggable="true"
                                @dragstart="onDragStart($event, element.tag)"
                            >
                                <v-avatar tile size="48" class="element-preview">
                                    <img
                                        v-if="element.img"
                                        :src="element.img"
                                        :alt="element.label"
                                    />
                                    <div v-else class="element-placeholder">
                                        {{ element.label.charAt(0) }}
                                    </div>
                                </v-avatar>
                                <div class="element-label">{{ element.label }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Canvas Area -->
            <div class="canvas-container" ref="pageRef">
                <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
            </div>
        </div>
    </div>

    <!-- Mobile Warning -->
    <div v-else class="mobile-warning">
        <v-icon icon="fas fa-mobile-alt" size="64" color="grey-lighten-1" />
        <h5 class="mt-4">Floor Editor Not Available on Mobile</h5>
        <p class="text-grey-darken-1">Please use a desktop device to edit floor plans.</p>
    </div>
</template>

<style lang="scss" scoped>
.floor-planner-container {
    display: flex;
    width: 100%;
    flex-direction: column;
    height: calc(100vh - 48px);
    background: rgb(var(--v-theme-background));
}

.top-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    background: rgb(var(--v-theme-surface));
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    z-index: 100;

    .toolbar-section {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .floor-name-input {
        width: 200px;
    }
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.left-panel {
    width: 320px;
    background: rgb(var(--v-theme-surface));
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;

    &.panel-collapsed {
        width: 56px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        min-height: 56px;

        .panel-title {
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            color: rgb(var(--v-theme-on-surface));
        }
    }

    &.panel-collapsed .panel-header {
        justify-content: center;
        padding: 8px;
    }

    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
}

.property-section {
    margin-bottom: 24px;

    .section-title {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 12px;
    }

    .property-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .property-label {
            flex: 1;
            font-size: 13px;
        }
    }

    .property-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .element-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
    }
}

.elements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 12px;

    .element-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 8px;
        cursor: grab;
        transition: all 0.2s ease;
        background: rgb(var(--v-theme-surface));

        &:hover {
            background: rgba(var(--v-theme-primary), 0.1);
            border-color: rgb(var(--v-theme-primary));
        }

        &:active {
            cursor: grabbing;
        }

        .element-preview {
            margin-bottom: 4px;
            background: rgb(var(--v-theme-surface-variant));
        }

        .element-placeholder {
            font-size: 20px;
            font-weight: 600;
            color: rgb(var(--v-theme-on-surface));
        }

        .element-label {
            font-size: 11px;
            text-align: center;
            word-break: break-word;
            color: rgb(var(--v-theme-on-surface));
        }
    }
}

.canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: rgb(var(--v-theme-background));
    display: flex;
    align-items: center;
    justify-content: center;

    canvas {
        display: block;
        background: rgb(var(--v-theme-surface));
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .v-theme--dark & {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
    }
}

.mobile-warning {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 20px;
    background: rgb(var(--v-theme-background));
}
.floor-planner-container {
    display: flex;
    width: 100%;
    flex-direction: column;
    height: calc(100vh - 48px);
    background: rgb(var(--v-theme-background));
}

.top-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    background: rgb(var(--v-theme-surface));
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    z-index: 100;

    .toolbar-section {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .floor-name-input {
        width: 200px;
    }
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.left-panel {
    width: 320px;
    background: rgb(var(--v-theme-surface));
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;

    &.panel-collapsed {
        width: 56px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        min-height: 56px;

        .panel-title {
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            color: rgb(var(--v-theme-on-surface));
        }
    }

    &.panel-collapsed .panel-header {
        justify-content: center;
        padding: 8px;
    }

    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
}

.property-section {
    margin-bottom: 24px;

    .section-title {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 12px;
    }

    .property-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .property-label {
            flex: 1;
            font-size: 13px;
            color: rgb(var(--v-theme-on-surface));
        }
    }

    .property-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .element-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
    }
}

.elements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 12px;

    .element-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 8px;
        cursor: grab;
        transition: all 0.2s ease;
        background: rgb(var(--v-theme-surface));

        &:hover {
            background: rgba(var(--v-theme-primary), 0.1);
            border-color: rgb(var(--v-theme-primary));
        }

        &:active {
            cursor: grabbing;
        }

        .element-preview {
            margin-bottom: 4px;
            background: rgb(var(--v-theme-surface-variant));
        }

        .element-placeholder {
            font-size: 20px;
            font-weight: 600;
            color: rgb(var(--v-theme-on-surface));
        }

        .element-label {
            font-size: 11px;
            text-align: center;
            word-break: break-word;
            color: rgb(var(--v-theme-on-surface));
        }
    }
}

.canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: rgb(var(--v-theme-background));
    display: flex;
    align-items: center;
    justify-content: center;

    canvas {
        display: block;
        background: rgb(var(--v-theme-surface));
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .v-theme--dark & {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
    }
}

.mobile-warning {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 20px;
    background: rgb(var(--v-theme-background));
}
</style>
