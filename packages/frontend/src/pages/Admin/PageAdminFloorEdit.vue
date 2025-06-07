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
import { exportFile, Loading } from "quasar";
import FTColorPickerButton from "src/components/FTColorPickerButton.vue";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { getFloorPath } from "src/db";
import { isTablet } from "src/global-reactives/screen-detection";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger.js";
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";

interface Props {
    floorId: string;
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();
const router = useRouter();
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
const isDrawingMode = ref(false);
const lineWidth = ref(2);
const drawingColor = ref("#000000");
const selectedBrushType = ref<"circle" | "pencil" | "spray">("pencil");
const showPropertiesPanel = ref(true);
const selectedTool = ref<"add" | "draw" | "select">("select");

const brushOptions = [
    { icon: "fa fa-pencil", label: "Pencil", value: "pencil" },
    { icon: "fa fa-paint-brush", label: "Spray", value: "spray" },
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
    Loading.show();
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
    Loading.hide();
});

async function exportFloor(): Promise<void> {
    if (!floorInstance.value || !(await showConfirm("Do you want to export this floor plan?"))) {
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

function toggleDrawingMode(): void {
    if (selectedTool.value === "draw") {
        selectedTool.value = "select";
        isDrawingMode.value = false;
        floorInstance.value?.setDrawingMode(false);
    } else {
        selectedTool.value = "draw";
        isDrawingMode.value = true;
        floorInstance.value?.setDrawingMode(true);
    }
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
    if (await showConfirm("Do you really want to delete this element?")) {
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

function selectAddTool(): void {
    selectedTool.value = "add";
    isDrawingMode.value = false;
    floorInstance.value?.setDrawingMode(false);
}

function selectSelectTool(): void {
    selectedTool.value = "select";
    isDrawingMode.value = false;
    floorInstance.value?.setDrawingMode(false);
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
                <q-btn-group flat>
                    <q-btn
                        flat
                        :color="selectedTool === 'select' ? 'primary' : ''"
                        icon="fa fa-mouse-pointer"
                        @click="selectSelectTool"
                        size="sm"
                    >
                        <q-tooltip>Select Tool</q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        :color="selectedTool === 'draw' ? 'primary' : ''"
                        icon="fa fa-paint-brush"
                        @click="toggleDrawingMode"
                        size="sm"
                    >
                        <q-tooltip>Drawing Tool</q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        :color="selectedTool === 'add' ? 'primary' : ''"
                        icon="fa fa-plus-square"
                        @click="selectAddTool"
                        size="sm"
                    >
                        <q-tooltip>Add Elements</q-tooltip>
                    </q-btn>
                </q-btn-group>

                <q-separator vertical inset class="q-mx-sm" />

                <q-btn-group flat>
                    <q-btn
                        flat
                        icon="fa fa-undo"
                        @click="undoAction"
                        :disabled="!floorInstanceState.canUndo"
                        size="sm"
                    >
                        <q-tooltip>Undo</q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        icon="fa fa-redo"
                        @click="redoAction"
                        :disabled="!floorInstanceState.canRedo"
                        size="sm"
                    >
                        <q-tooltip>Redo</q-tooltip>
                    </q-btn>
                </q-btn-group>

                <q-separator vertical inset class="q-mx-sm" />

                <q-btn flat icon="fa fa-th" @click="floorInstance?.toggleGridVisibility" size="sm">
                    <q-tooltip>Toggle Grid</q-tooltip>
                </q-btn>
            </div>

            <div class="toolbar-section">
                <q-input
                    dense
                    outlined
                    :model-value="floorInstance?.name"
                    @update:model-value="(event) => onFloorChange({ name: event as string })"
                    placeholder="Floor Name"
                    class="floor-name-input"
                />
            </div>

            <div class="toolbar-section">
                <q-btn-group flat>
                    <q-btn flat icon="fa fa-file-import" @click="triggerFileInput" size="sm">
                        <q-tooltip>Import Floor</q-tooltip>
                    </q-btn>
                    <q-btn flat icon="fa fa-file-export" @click="exportFloor" size="sm">
                        <q-tooltip>Export Floor</q-tooltip>
                    </q-btn>
                </q-btn-group>

                <q-separator vertical inset class="q-mx-sm" />

                <q-btn
                    :disabled="!hasChanges"
                    unelevated
                    color="primary"
                    icon="fa fa-save"
                    label="Save"
                    @click="onFloorSave"
                    size="sm"
                />
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
                    <q-btn
                        flat
                        dense
                        round
                        :icon="showPropertiesPanel ? 'fa fa-chevron-left' : 'fa fa-chevron-right'"
                        @click="showPropertiesPanel = !showPropertiesPanel"
                        size="xs"
                    >
                        <q-tooltip>{{
                            showPropertiesPanel ? "Collapse Panel" : "Expand Panel"
                        }}</q-tooltip>
                    </q-btn>
                </div>

                <div v-if="showPropertiesPanel" class="panel-content">
                    <!-- Floor Properties -->
                    <div class="property-section">
                        <div class="section-title">Floor Settings</div>
                        <div class="property-row">
                            <q-input
                                dense
                                outlined
                                type="number"
                                label="Width"
                                :model-value="floorInstanceState.width"
                                @update:model-value="
                                    (event) => onFloorChange({ width: event as number })
                                "
                                :min="300"
                                :max="MAX_FLOOR_WIDTH"
                                :step="RESOLUTION"
                                @keydown.prevent
                            />
                            <q-input
                                dense
                                outlined
                                type="number"
                                label="Height"
                                :model-value="floorInstanceState.height"
                                @update:model-value="
                                    (event) => onFloorChange({ height: event as number })
                                "
                                :min="300"
                                :max="MAX_FLOOR_HEIGHT"
                                :step="RESOLUTION"
                                @keydown.prevent
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
                        <q-select
                            dense
                            outlined
                            v-model="selectedBrushType"
                            :options="brushOptions"
                            @update:model-value="updateBrushType"
                            label="Brush Type"
                            emit-value
                            option-value="value"
                            option-label="label"
                        >
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps">
                                    <q-item-section avatar>
                                        <q-icon :name="scope.opt.icon" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                        <div class="property-row">
                            <div class="property-label">Color</div>
                            <FTColorPickerButton
                                :model-value="drawingColor"
                                @update:model-value="updateBrushColor"
                            />
                        </div>
                        <div class="property-row">
                            <div class="property-label">Size</div>
                            <q-slider
                                v-model.number="lineWidth"
                                :min="1"
                                :max="50"
                                :step="1"
                                label
                                @update:model-value="updateLineWidth"
                                color="primary"
                            />
                        </div>
                    </div>

                    <!-- Element Properties -->
                    <div class="property-section" v-if="selectedElement">
                        <div class="section-title">Element Properties</div>
                        <div class="property-grid">
                            <q-input
                                dense
                                outlined
                                v-model.number="elementProperties.left"
                                type="number"
                                label="X"
                            />
                            <q-input
                                dense
                                outlined
                                v-model.number="elementProperties.top"
                                type="number"
                                label="Y"
                            />
                            <q-input
                                dense
                                outlined
                                v-model.number="elementProperties.width"
                                type="number"
                                label="Width"
                            />
                            <q-input
                                dense
                                outlined
                                v-model.number="elementProperties.height"
                                type="number"
                                label="Height"
                            />
                        </div>
                        <q-input
                            dense
                            outlined
                            v-model.number="elementProperties.angle"
                            type="number"
                            label="Rotation"
                            suffix="°"
                            class="q-mt-sm"
                        />
                        <q-input
                            v-if="isTable(selectedElement)"
                            dense
                            outlined
                            :model-value="elementProperties.label"
                            @update:model-value="updateTableLabel"
                            label="Table ID"
                            class="q-mt-sm"
                            :debounce="500"
                        />
                        <div class="property-row q-mt-sm">
                            <div class="property-label">Color</div>
                            <FTColorPickerButton
                                :model-value="elementProperties.color"
                                @update:model-value="setElementColor"
                            />
                        </div>
                        <div class="element-actions q-mt-md">
                            <q-btn
                                flat
                                dense
                                icon="fa fa-copy"
                                @click="floorInstance?.copySelectedElement()"
                                size="sm"
                            >
                                <q-tooltip>Copy</q-tooltip>
                            </q-btn>
                            <q-btn flat dense icon="fa fa-level-down" @click="sendBack" size="sm">
                                <q-tooltip>Send Back</q-tooltip>
                            </q-btn>
                            <q-btn
                                v-if="'flip' in selectedElement"
                                flat
                                dense
                                icon="fa fa-arrows-alt-h"
                                @click="selectedElement.flip()"
                                size="sm"
                            >
                                <q-tooltip>Flip</q-tooltip>
                            </q-btn>
                            <q-btn
                                v-if="'nextDesign' in selectedElement"
                                flat
                                dense
                                icon="fa fa-chevron-right"
                                @click="selectedElement.nextDesign()"
                                size="sm"
                            >
                                <q-tooltip>Switch Design</q-tooltip>
                            </q-btn>
                            <q-space />
                            <q-btn
                                flat
                                dense
                                icon="fa fa-trash"
                                color="negative"
                                @click="deleteSelectedElement"
                                size="sm"
                            >
                                <q-tooltip>Delete</q-tooltip>
                            </q-btn>
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
                                <q-avatar square size="48px" class="element-preview">
                                    <img
                                        v-if="element.img"
                                        :src="element.img"
                                        :alt="element.label"
                                    />
                                    <div v-else class="element-placeholder">
                                        {{ element.label.charAt(0) }}
                                    </div>
                                </q-avatar>
                                <div class="element-label">{{ element.label }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Canvas Area -->
            <div class="canvas-container" ref="pageRef">
                <div class="canvas-wrapper">
                    <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
                </div>
            </div>
        </div>
    </div>

    <!-- Mobile Warning -->
    <div v-else class="mobile-warning">
        <q-icon name="fa fa-mobile-alt" size="64px" color="grey-5" />
        <h5 class="q-mt-md">Floor Editor Not Available on Mobile</h5>
        <p class="text-grey-6">Please use a desktop device to edit floor plans.</p>
    </div>
</template>

<style lang="scss" scoped>
.floor-planner-container {
    display: flex;
    width: 100%;
    flex-direction: column;
    height: 100vh;
    background: $grey-2;

    .body--dark & {
        background: $dark;
    }
}

.top-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    background: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    z-index: 100;

    .body--dark & {
        background: $dark-page;
        border-bottom-color: rgba(255, 255, 255, 0.12);
    }

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
    background: white;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;

    .body--dark & {
        background: $dark-page;
        border-right-color: rgba(255, 255, 255, 0.12);
    }

    &.panel-collapsed {
        width: 48px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);

        .body--dark & {
            border-bottom-color: rgba(255, 255, 255, 0.12);
        }

        .panel-title {
            font-weight: 600;
            font-size: 14px;
        }
    }

    &.panel-collapsed .panel-header {
        justify-content: center;
        padding: 16px 8px;
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
        color: $grey-7;
        margin-bottom: 12px;

        .body--dark & {
            color: $grey-5;
        }
    }

    .property-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .property-label {
            flex: 1;
            font-size: 13px;
            color: $grey-8;

            .body--dark & {
                color: $grey-4;
            }
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
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .element-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: grab;
        transition: all 0.2s ease;

        &:hover {
            background: rgba($primary, 0.1);
            border-color: $primary;
        }

        &:active {
            cursor: grabbing;
        }

        .element-preview {
            margin-bottom: 4px;
            background: $grey-2;

            .body--dark & {
                background: $grey-9;
            }
        }

        .element-placeholder {
            font-size: 20px;
            font-weight: 600;
            color: $grey-7;
        }

        .element-label {
            font-size: 11px;
            text-align: center;
            word-break: break-word;
        }
    }
}

.canvas-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;

    .canvas-wrapper {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;

        .body--dark & {
            background: $dark-page;
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
}
</style>
