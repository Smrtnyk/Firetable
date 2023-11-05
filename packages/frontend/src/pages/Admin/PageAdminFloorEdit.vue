<script setup lang="ts">
import AddTableDialog from "src/components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "src/components/Floor/ShowSelectedElement.vue";
import FTDialog from "src/components/FTDialog.vue";

import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { NumberTuple } from "src/types/generic";
import { useRouter } from "vue-router";
import { debounce, exportFile, Loading, useQuasar } from "quasar";
import { BULK_ADD_COLLECTION, ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    extractAllTablesLabels,
    Floor,
    FloorEditor,
    FloorEditorElement,
    FloorMode,
    hasFloorTables,
    MAX_FLOOR_HEIGHT,
    MAX_FLOOR_WIDTH,
    RESOLUTION,
} from "@firetable/floor-creator";
import { ElementTag, FloorDoc } from "@firetable/types";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isNumber } from "@firetable/utils";
import { isMobile, buttonSize } from "src/global-reactives/is-mobile";
import { getFloorPath } from "@firetable/backend";

type ElementDescriptor = {
    tag: ElementTag;
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

const NON_TABLE_EL_TO_ADD = [
    ElementTag.SOFA,
    ElementTag.SINGLE_SOFA,
    ElementTag.DJ_BOOTH,
    ElementTag.WALL,
    ElementTag.STAGE,
];

const props = defineProps<Props>();
const router = useRouter();
const q = useQuasar();
const floorInstance = ref<FloorEditor | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const pageRef = ref<HTMLDivElement | null>(null);
const selectedElement = ref<FloorEditorElement | undefined>();
const bulkMode = ref(false);
const bulkElement = ref<ElementTag | null>(null);
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
        instantiateFloor(floor.value);
        Loading.hide();
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", resizeFloor);
    } else {
        router.replace("/").catch(showErrorMessage);
        Loading.hide();
        return;
    }
    Loading.hide();
});

const resizeFloor = debounce((): void => {
    if (!pageRef.value || !floorInstance.value) {
        return;
    }
    floorInstance.value.resize(pageRef.value.clientWidth);
}, 100);

function instantiateFloor(floorDoc: FloorDoc): void {
    if (!canvasRef.value || !pageRef.value) return;

    floorInstance.value = new FloorEditor({
        canvas: canvasRef.value,
        floorDoc,
        mode: FloorMode.EDITOR,
        containerWidth: pageRef.value.clientWidth,
    });

    floorInstance.value.on("elementClicked", elementClickHandler);
    floorInstance.value.on("doubleClick", dblClickHandler);
    floorInstance.value.on("commandChange", () => {
        undoRedoState.canUndo = floorInstance.value!.canUndo();
        undoRedoState.canRedo = floorInstance.value!.canRedo();
    });
}

function onFloorSave(): void {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as FloorEditor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    tryCatchLoadingWrapper({
        hook: () =>
            updateFirestoreDocument(getFirestoreDocument(floorPath), {
                json: floorInstance.value?.json,
                name: floorInstance.value?.name,
                width: floorInstance.value?.width,
                height: floorInstance.value?.height,
            }),
    });
}

function onFloorChange(prop: keyof FloorEditor, event: null | number | string): void {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.setFloorName(String(event));

    if (prop === "width" && isNumber(event)) {
        floorInstance.value.updateDimensions(event, floorInstance.value.height);
    }
    if (prop === "height" && isNumber(event)) {
        floorInstance.value.updateDimensions(floorInstance.value.width, event);
    }
}

function showTableDialog(floorVal: FloorEditor, [x, y]: NumberTuple, tag: ElementTag): void {
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

        if (NON_TABLE_EL_TO_ADD.includes(tag)) {
            floorVal.addElement({ x, y, tag });
            return;
        }

        showTableDialog(floorVal, [x, y], tag);
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

function activateBulkMode(elementTag: ElementTag): void {
    bulkMode.value = true;
    bulkElement.value = elementTag;

    // Get all current labels using the helper function
    const labels = extractAllTablesLabels(floorInstance.value as FloorEditor);
    // Convert labels to numbers only if they are numeric and find the maximum
    const numericLabels = labels.map((label) => parseInt(label, 10)).filter(isNumber);

    if (numericLabels.length === 0) {
        bulkLabelCounter.value = 0;
    } else {
        const maxLabel = Math.max(...numericLabels);
        bulkLabelCounter.value = isNumber(maxLabel) ? maxLabel : 0;
    }
}

function deactivateBulkMode(): void {
    bulkMode.value = false;
    bulkElement.value = null;
    bulkLabelCounter.value = 0;
}

function undoAction(): void {
    if (floorInstance.value) {
        floorInstance.value.undo();
        floorInstance.value.canvas.renderAll(); // Refresh the canvas after undo
    }
}

function redoAction(): void {
    if (floorInstance.value) {
        floorInstance.value.redo();
        floorInstance.value.canvas.renderAll(); // Refresh the canvas after redo
    }
}

function exportFloor(floorVal: FloorEditor): void {
    exportFile(`${floorVal.name}.json`, JSON.stringify(floorVal.json));
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
                floorInstance.value.renderData(jsonData);
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

        <ShowSelectedElement
            v-if="floorInstance"
            @delete="onDeleteElement"
            :selected-floor-element="selectedElement"
            :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
        >
            <template #buttons>
                <q-btn rounded :disabled="!undoRedoState.canUndo" @click="undoAction" icon="undo" />
                <q-btn rounded :disabled="!undoRedoState.canRedo" @click="redoAction" icon="redo" />
                <q-btn rounded @click="floorInstance.toggleGridVisibility" icon="grid" />
                <q-btn
                    rounded
                    @click="toggleBulkMode"
                    icon="stack"
                    :color="bulkMode ? 'positive' : undefined"
                />
                <q-btn rounded icon="export" @click="exportFloor(floorInstance as FloorEditor)" />
                <q-btn rounded icon="import" @click="triggerFileInput" />
                <input
                    ref="fileInputRef"
                    type="file"
                    @change="onFileSelected"
                    style="display: none"
                    accept=".json"
                />
            </template>
        </ShowSelectedElement>

        <div class="row q-pa-sm q-col-gutter-md" v-if="floorInstance">
            <div class="col-6">
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
            <div class="col-6">
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
