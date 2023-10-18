<script setup lang="ts">
import AddTableDialog from "components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import FTDialog from "components/FTDialog.vue";

import { nextTick, onMounted, ref } from "vue";
import { NumberTuple } from "src/types/generic";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    BaseTable,
    extractAllTablesLabels,
    Floor,
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

type ElementDescriptor = {
    tag: ElementTag;
};

interface BottomSheetTableClickResult {
    elementDescriptor: ElementDescriptor;
}

interface Props {
    floorID: string;
}
const addNewElementsBottomSheetOptions = {
    message: "Choose action",
    grid: true,
    actions: ELEMENTS_TO_ADD_COLLECTION,
};

const NON_TABLE_EL_TO_ADD = [ElementTag.SOFA, ElementTag.DJ_BOOTH, ElementTag.WALL];

const props = defineProps<Props>();
const router = useRouter();
const q = useQuasar();
const floorInstance = ref<Floor | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const pageRef = ref<HTMLDivElement | null>(null);
const selectedElement = ref<FloorEditorElement | null>(null);
const { data: floor, promise: floorDataPromise } = useFirestoreDocument<FloorDoc>(
    `${Collection.FLOORS}/${props.floorID}`,
    {
        once: true,
    },
);

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

    floorInstance.value = new Floor({
        canvas: canvasRef.value,
        floorDoc,
        dblClickHandler,
        elementClickHandler,
        mode: FloorMode.EDITOR,
        containerWidth: pageRef.value.clientWidth,
    });
}

function onFloorSave(): void {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as Floor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    tryCatchLoadingWrapper({
        hook: () =>
            updateFirestoreDocument(getFirestoreDocument(`${Collection.FLOORS}/${props.floorID}`), {
                json: floorInstance.value?.json,
                name: floorInstance.value?.name,
                width: floorInstance.value?.width,
                height: floorInstance.value?.height,
            }),
    });
}

function onFloorChange(prop: keyof Floor, event: null | number | string) {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.setFloorName(String(event));

    if (prop === "width" && isNumber(event)) {
        floorInstance.value.updateDimensions(event, floorInstance.value.height);
    }
    if (prop === "height" && isNumber(event)) {
        floorInstance.value.updateDimensions(floorInstance.value.width, event);
    }
}

function showTableDialog(floor: Floor, [x, y]: NumberTuple, tag: ElementTag) {
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

function handleAddNewElement(floor: Floor, [x, y]: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        const { tag } = elementDescriptor;

        if (NON_TABLE_EL_TO_ADD.includes(tag)) {
            floor.addElement({ x, y, tag });
            return;
        }

        showTableDialog(floor, [x, y], tag);
    };
}

function dblClickHandler(floor: Floor, coords: NumberTuple) {
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floor, coords));
}

async function elementClickHandler(_: Floor, element: FloorEditorElement | null) {
    selectedElement.value = null;
    await nextTick();
    selectedElement.value = element;
}

function onDeleteElement(element: BaseTable) {
    const elementToDelete = element.canvas?.getActiveObject();
    if (!elementToDelete) return;
    element.canvas?.remove(elementToDelete);
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
                        size="md"
                        rounded
                    />
                </template>
            </q-input>
        </div>
        <div class="row items-center">
            <ShowSelectedElement
                @delete="onDeleteElement"
                :selected-floor-element="selectedElement"
                class="col"
            />

            <div class="col-auto">
                <q-btn
                    v-if="floorInstance"
                    class="button-gradient"
                    @click="floorInstance.toggleGridVisibility"
                    label="Toggle Grid"
                    size="sm"
                    rounded
                />
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
                    :max="1000"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('width', event)"
                />
            </div>
            <div class="col-6">
                <q-badge color="secondary">
                    Height: {{ floorInstance.height }} (300 to 1000)
                </q-badge>
                <q-slider
                    :min="300"
                    :max="1000"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('height', event)"
                    :model-value="floorInstance.height"
                />
            </div>
        </div>

        <canvas ref="canvasRef" class="shadow-3" />
    </div>
</template>
