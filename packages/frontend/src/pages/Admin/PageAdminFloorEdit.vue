<script setup lang="ts">
import AddTableDialog from "components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import FTDialog from "components/FTDialog.vue";

import { computed, nextTick, onMounted, ref } from "vue";
import { NumberTuple } from "src/types/generic";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { BULK_ADD_COLLECTION, ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    extractAllTablesLabels,
    Floor,
    FloorEditor,
    FloorEditorElement,
    FloorMode,
    hasFloorTables,
    RESOLUTION,
} from "@firetable/floor-creator";
import { Collection, ElementTag, FloorDoc } from "@firetable/types";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isNumber } from "@firetable/utils";
import { isMobile } from "src/global-reactives/is-mobile";

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

const buttonSize = computed(() => (isMobile ? "xs" : "md"));
const floorPath = `${Collection.ORGANISATIONS}/${props.organisationId}/${Collection.PROPERTIES}/${props.propertyId}/${Collection.FLOORS}/${props.floorId}`;
const {
    data: floor,
    promise: floorDataPromise,
    pending: isFloorLoading,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });

onMounted(async () => {
    Loading.show();
    await floorDataPromise.value;
    if (floor.value) {
        instantiateFloor(floor.value);
        Loading.hide();
    } else {
        router.replace("/").catch(showErrorMessage);
        Loading.hide();
        return;
    }
    Loading.hide();
});

function instantiateFloor(floorDoc: FloorDoc) {
    if (!canvasRef.value || !pageRef.value) return;

    floorInstance.value = new FloorEditor({
        canvas: canvasRef.value,
        floorDoc,
        dblClickHandler,
        elementClickHandler,
        mode: FloorMode.EDITOR,
        containerWidth: pageRef.value.clientWidth,
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

function onFloorChange(prop: keyof FloorEditor, event: null | number | string) {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.setFloorName(String(event));

    if (prop === "width" && isNumber(event)) {
        floorInstance.value.updateDimensions(event, floorInstance.value.height);
    }
    if (prop === "height" && isNumber(event)) {
        floorInstance.value.updateDimensions(floorInstance.value.width, event);
    }
}

function showTableDialog(floor: FloorEditor, [x, y]: NumberTuple, tag: ElementTag) {
    const dialog = q.dialog({
        component: FTDialog,
        componentProps: {
            component: AddTableDialog,
            maximized: false,
            title: "Table ID",
            componentPropsObject: {
                ids: new Set(extractAllTablesLabels(floor)),
            },
            listeners: {
                create: function (label: string) {
                    dialog.hide();
                    floor.addElement({ label, x, y, tag });
                },
            },
        },
    });
}

function handleAddNewElement(floor: FloorEditor, [x, y]: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        const { tag } = elementDescriptor;

        if (NON_TABLE_EL_TO_ADD.includes(tag)) {
            floor.addElement({ x, y, tag });
            return;
        }

        showTableDialog(floor, [x, y], tag);
    };
}

function dblClickHandler(floor: FloorEditor, coords: NumberTuple) {
    if (bulkMode.value && bulkElement.value) {
        const label = String(++bulkLabelCounter.value);
        floor.addElement({ label, x: coords[0], y: coords[1], tag: bulkElement.value });
        return;
    }
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floor, coords));
}

async function elementClickHandler(_: Floor, element: FloorEditorElement | undefined) {
    selectedElement.value = undefined;
    await nextTick();
    selectedElement.value = element;
}

function onDeleteElement(element: FloorEditorElement) {
    const elementToDelete = element.canvas?.getActiveObject();
    if (!elementToDelete) return;
    element.canvas?.remove(elementToDelete);
}

function toggleBulkMode() {
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

function activateBulkMode(elementTag: ElementTag) {
    bulkMode.value = true;
    bulkElement.value = elementTag;

    // Get all current labels using the helper function
    const labels = extractAllTablesLabels(floorInstance.value as FloorEditor);
    // Convert labels to numbers only if they are numeric and find the maximum
    const numericLabels = labels.map((label) => parseInt(label)).filter(isNumber);

    if (numericLabels.length === 0) {
        bulkLabelCounter.value = 0;
    } else {
        const maxLabel = Math.max(...numericLabels);
        bulkLabelCounter.value = isNumber(maxLabel) ? maxLabel : 0;
    }
}

function deactivateBulkMode() {
    bulkMode.value = false;
    bulkElement.value = null;
    bulkLabelCounter.value = 0;
}
</script>

<template>
    <div class="PageAdminFloorEdit" ref="pageRef">
        <div v-if="floorInstance" class="PageAdminFloorEdit__controls justify-between">
            <q-input
                standout
                rounded
                label="Floor name"
                @update:model-value="(event) => onFloorChange('name', event)"
                :model-value="floorInstance.name"
            >
                <template #append>
                    <q-btn
                        class="button-gradient"
                        icon="save"
                        @click="onFloorSave"
                        label="save"
                        rounded
                    />
                </template>
            </q-input>
        </div>
        <div v-if="floorInstance" class="row">
            <ShowSelectedElement
                @delete="onDeleteElement"
                :selected-floor-element="selectedElement"
                :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
                class="col"
            />

            <div class="row q-pa-sm q-col-gutter-md">
                <div class="col-auto flex q-pl-none justify-end">
                    <q-btn
                        v-if="floorInstance"
                        @click="floorInstance.toggleGridVisibility"
                        icon="grid"
                        :size="buttonSize"
                    />
                </div>
                <div class="col-auto flex q-pl-none justify-end">
                    <q-btn
                        @click="toggleBulkMode"
                        icon="stack"
                        :color="bulkMode ? 'positive' : undefined"
                        :size="buttonSize"
                    />
                </div>
            </div>
        </div>
        <div class="row q-pa-sm q-col-gutter-md" v-if="floorInstance">
            <div class="col-6">
                <q-badge color="secondary">
                    Width: {{ floorInstance.width }} (300 to 1000)
                </q-badge>
                <q-slider
                    :model-value="floorInstance.width"
                    :min="300"
                    :max="1005"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('width', event)"
                />
            </div>
            <div class="col-6">
                <q-badge color="secondary">
                    Height: {{ floorInstance.height }} (300 to 1200)
                </q-badge>
                <q-slider
                    :min="300"
                    :max="1200"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('height', event)"
                    :model-value="floorInstance.height"
                />
            </div>
        </div>

        <canvas v-if="floor && !isFloorLoading" ref="canvasRef" class="shadow-3" />
    </div>
</template>
