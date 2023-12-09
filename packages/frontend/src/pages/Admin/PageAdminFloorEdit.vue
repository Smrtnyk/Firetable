<script setup lang="ts">
import type { NumberTuple } from "src/types/generic";
import type { Floor, FloorEditorElement } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import AddTableDialog from "src/components/Floor/AddTableDialog.vue";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FTDialog from "src/components/FTDialog.vue";

import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { debounce, exportFile, Loading, useQuasar } from "quasar";
import { BULK_ADD_COLLECTION, ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    extractAllTablesLabels,
    FloorEditor,
    hasFloorTables,
    MAX_FLOOR_HEIGHT,
    MAX_FLOOR_WIDTH,
    RESOLUTION,
    FloorElementTypes,
} from "@firetable/floor-creator";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isNumber } from "@firetable/utils";
import { isMobile, buttonSize, isTablet } from "src/global-reactives/screen-detection";
import { getFloorPath } from "@firetable/backend";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";

type ElementDescriptor = {
    tag: FloorElementTypes;
};

interface BottomSheetTableClickResult {
    elementDescriptor: ElementDescriptor;
}

interface Props {
    floorId: string;
    organisationId: string;
    propertyId: string;
}
const addNewElementsBottomSheetOptions = {
    message: "Choose action",
    grid: true,
    actions: ELEMENTS_TO_ADD_COLLECTION,
};

const TABLE_EL_TO_ADD = [FloorElementTypes.RECT_TABLE, FloorElementTypes.ROUND_TABLE];

const props = defineProps<Props>();
const router = useRouter();
const q = useQuasar();
const floorInstance = ref<FloorEditor | undefined>();
const canvasRef = ref<HTMLCanvasElement | undefined>();
const pageRef = ref<HTMLDivElement | undefined>();
const selectedElement = ref<FloorEditorElement | undefined>();
const bulkMode = ref(false);
const bulkElement = ref<FloorElementTypes | undefined>();
const bulkLabelCounter = ref(0); // To auto-increment labels

const floorPath = getFloorPath(props.organisationId, props.propertyId, props.floorId);
const {
    data: floor,
    promise: floorDataPromise,
    pending: isFloorLoading,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });

const undoRedoState = reactive({
    canUndo: false,
    canRedo: false,
});
let unregisterStateChangeListener: () => void | undefined;

function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "s") {
        // Prevents browser's save dialog from showing
        event.preventDefault();
        onFloorSave();
    }
}

onBeforeUnmount(() => {
    unregisterStateChangeListener?.();
    floorInstance.value?.destroy();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", resizeFloor);
});

onMounted(async () => {
    Loading.show();
    await floorDataPromise.value;
    if (floor.value) {
        await instantiateFloor(floor.value);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", resizeFloor);
    } else {
        router.replace("/").catch(showErrorMessage);
    }

    Loading.hide();
});

const resizeFloor = debounce((): void => {
    if (!pageRef.value || !floorInstance.value) {
        return;
    }
    floorInstance.value.resize(pageRef.value.clientWidth);
}, 100);

async function instantiateFloor(floorDoc: FloorDoc): Promise<void> {
    if (!canvasRef.value || !pageRef.value) return;

    const floorEditor = new FloorEditor({
        canvas: canvasRef.value,
        floorDoc: await decompressFloorDoc(floorDoc),
        containerWidth: pageRef.value.clientWidth,
    });
    floorInstance.value = floorEditor;

    floorEditor.on("elementClicked", elementClickHandler);
    floorEditor.on("doubleClick", dblClickHandler);
    floorEditor.on("commandChange", () => {
        undoRedoState.canUndo = floorEditor.canUndo();
        undoRedoState.canRedo = floorEditor.canRedo();
    });
}

async function onFloorSave(): Promise<void> {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as FloorEditor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    const { name, width, height, json } = floorInstance.value;
    console.log(
        floorInstance.value.canvas.getObjects().filter((obj) => {
            return obj.type === FloorElementTypes.SPIRAL_STAIRCASE;
        }),
    );

    await tryCatchLoadingWrapper({
        hook: async function () {
            await updateFirestoreDocument(getFirestoreDocument(floorPath), {
                json: await compressFloorDoc(json),
                name,
                width,
                height,
                compressed: true,
            });
        },
    });
}

function onFloorChange(prop: keyof FloorEditor, event: null | number | string): void {
    if (!floorInstance.value) return;
    if (prop === "name") {
        floorInstance.value.setFloorName(String(event));
        return;
    }

    const isValidNumber = event && !Number.isNaN(+event);
    if (prop === "width" && isValidNumber) {
        floorInstance.value.updateDimensions(+event, floorInstance.value.height);
    }
    if (prop === "height" && isValidNumber) {
        floorInstance.value.updateDimensions(floorInstance.value.width, +event);
    }
}

function showTableDialog(floorVal: FloorEditor, [x, y]: NumberTuple, tag: FloorElementTypes): void {
    const dialog = q.dialog({
        component: FTDialog,
        componentProps: {
            component: AddTableDialog,
            maximized: false,
            title: "Table ID",
            componentPropsObject: {
                ids: new Set(extractAllTablesLabels(floorVal)),
            },
            listeners: {
                create: function (label: string) {
                    dialog.hide();
                    floorVal.addElement({ label, x, y, tag });
                },
            },
        },
    });
}

function handleAddNewElement(floorVal: FloorEditor, [x, y]: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        const { tag } = elementDescriptor;
        if (TABLE_EL_TO_ADD.includes(tag)) {
            showTableDialog(floorVal, [x, y], tag);
            return;
        }
        floorVal.addElement({ x, y, tag });
    };
}

function dblClickHandler(floorVal: FloorEditor, coords: NumberTuple): void {
    if (bulkMode.value && bulkElement.value) {
        const label = String(++bulkLabelCounter.value);
        floorVal.addElement({ label, x: coords[0], y: coords[1], tag: bulkElement.value });
        return;
    }
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floorVal, coords));
}

async function elementClickHandler(
    _: Floor,
    element: FloorEditorElement | undefined,
): Promise<void> {
    selectedElement.value = undefined;
    await nextTick();
    selectedElement.value = element;
}

function onDeleteElement(element: FloorEditorElement): void {
    const elementToDelete = element.canvas?.getActiveObject();
    if (!elementToDelete) return;
    element.canvas?.remove(elementToDelete);
    selectedElement.value = undefined;
}

function toggleBulkMode(): void {
    if (bulkMode.value) {
        // If already in bulk mode, deactivate it
        deactivateBulkMode();
    } else {
        // If not in bulk mode, show the bottom sheet to select an element for bulk addition
        q.bottomSheet({ ...addNewElementsBottomSheetOptions, actions: BULK_ADD_COLLECTION }).onOk(
            ({ elementDescriptor }: BottomSheetTableClickResult) => {
                activateBulkMode(elementDescriptor.tag);
            },
        );
    }
}

function activateBulkMode(elementTag: FloorElementTypes): void {
    bulkMode.value = true;
    bulkElement.value = elementTag;

    // Get all current labels using the helper function
    const labels = extractAllTablesLabels(floorInstance.value as FloorEditor);
    // Convert labels to numbers only if they are numeric and find the maximum
    const numericLabels = labels.map((label) => Number.parseInt(label, 10)).filter(isNumber);

    if (numericLabels.length === 0) {
        bulkLabelCounter.value = 0;
    } else {
        const maxLabel = Math.max(...numericLabels);
        bulkLabelCounter.value = isNumber(maxLabel) ? maxLabel : 0;
    }
}

function deactivateBulkMode(): void {
    bulkMode.value = false;
    bulkElement.value = undefined;
    bulkLabelCounter.value = 0;
}

function undoAction(): void {
    if (!floorInstance.value) {
        return;
    }
    floorInstance.value.undo();
    floorInstance.value.canvas.renderAll();
}

function redoAction(): void {
    if (!floorInstance.value) {
        return;
    }
    floorInstance.value.redo();
    floorInstance.value.canvas.renderAll();
}

async function exportFloor(floorVal: FloorEditor): Promise<void> {
    if (!(await showConfirm("Do you want to export this floor plan?"))) {
        return;
    }
    exportFile(
        `${floorVal.name}.json`,
        JSON.stringify({
            json: floorVal.json,
            width: floorVal.width,
            height: floorVal.height,
        }),
    );
}

const fileInputRef = ref<HTMLInputElement | null>(null);
function onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (floorInstance.value) {
                floorInstance.value.importFloor(jsonData);
            }
        };
        reader.readAsText(file);
    }
}

function triggerFileInput(): void {
    fileInputRef.value?.click();
}
</script>

<template>
    <div class="PageAdminFloorEdit" ref="pageRef">
        <div v-if="floorInstance" class="justify-between q-mb-sm">
            <q-input
                standout
                rounded
                label="Floor name"
                @update:model-value="(event) => onFloorChange('name', event)"
                :model-value="floorInstance.name"
                :dense="isMobile"
            >
                <template #append>
                    <q-btn
                        class="button-gradient"
                        @click="onFloorSave"
                        label="save"
                        rounded
                        :size="buttonSize"
                    />
                </template>
            </q-input>
        </div>

        <FloorEditorControls
            v-if="floorInstance"
            @delete="onDeleteElement"
            :selected-floor-element="selectedElement"
            :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
        >
            <template #buttons>
                <q-input
                    v-if="!isTablet"
                    @keydown.prevent
                    :min="300"
                    :max="MAX_FLOOR_WIDTH"
                    :step="RESOLUTION"
                    :model-value="floorInstance.width"
                    @update:model-value="(event) => onFloorChange('width', event)"
                    standout
                    rounded
                    type="number"
                    label="Floor width"
                    class="q-ma-xs"
                />
                <q-input
                    v-if="!isTablet"
                    @keydown.prevent
                    :min="300"
                    :max="MAX_FLOOR_HEIGHT"
                    :step="RESOLUTION"
                    @update:model-value="(event) => onFloorChange('height', event)"
                    :model-value="floorInstance.height"
                    standout
                    rounded
                    type="number"
                    label="Floor height"
                    class="q-ma-xs"
                />
                <q-btn
                    title="Undo"
                    round
                    :disabled="!undoRedoState.canUndo"
                    @click="undoAction"
                    icon="undo"
                />
                <q-btn
                    title="Redo"
                    round
                    :disabled="!undoRedoState.canRedo"
                    @click="redoAction"
                    icon="redo"
                />
                <q-btn
                    round
                    title="Toggle grid"
                    @click="floorInstance.toggleGridVisibility"
                    icon="grid"
                />
                <q-btn
                    title="Toggle bulk mode"
                    round
                    @click="toggleBulkMode"
                    icon="stack"
                    :color="bulkMode ? 'positive' : undefined"
                />
                <q-btn
                    round
                    icon="export"
                    title="Export floor plan"
                    @click="exportFloor(floorInstance as FloorEditor)"
                />
                <q-btn round title="Import floor plan" icon="import" @click="triggerFileInput" />
                <input
                    ref="fileInputRef"
                    type="file"
                    @change="onFileSelected"
                    style="display: none"
                    accept=".json"
                />
            </template>
        </FloorEditorControls>

        <div class="row q-pa-sm q-col-gutter-md" v-if="floorInstance">
            <div class="col-6" v-if="isTablet">
                <q-badge color="secondary">
                    Width: {{ floorInstance.width }} (300 to {{ MAX_FLOOR_WIDTH }})
                </q-badge>
                <q-slider
                    :model-value="floorInstance.width"
                    :min="300"
                    :max="MAX_FLOOR_WIDTH"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('width', event)"
                />
            </div>
            <div class="col-6" v-if="isTablet">
                <q-badge color="secondary">
                    Height: {{ floorInstance.height }} (300 to {{ MAX_FLOOR_HEIGHT }})
                </q-badge>
                <q-slider
                    :min="300"
                    :max="MAX_FLOOR_HEIGHT"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('height', event)"
                    :model-value="floorInstance.height"
                />
            </div>
        </div>

        <q-card>
            <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
        </q-card>
    </div>
</template>
