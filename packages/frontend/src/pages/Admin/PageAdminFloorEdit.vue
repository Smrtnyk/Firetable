<script setup lang="ts">
import AddTableDialog from "components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import FTDialog from "components/FTDialog.vue";

import { nextTick, onMounted, ref } from "vue";
import { NumberTuple } from "src/types/generic";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    BaseTable,
    extractAllTablesLabels,
    Floor,
    FloorMode,
    hasFloorTables,
    RESOLUTION,
} from "@firetable/floorcreator";
import { Collection, ElementTag, ElementType, FloorDoc } from "@firetable/types";
import { showErrorMessage, tryCatchLoadingWrapper } from "@firetable/utils";

type ElementDescriptor = {
    tag: ElementTag;
    type: ElementType;
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

const props = defineProps<Props>();
const router = useRouter();
const q = useQuasar();
const floorInstance = ref<Floor | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const pageRef = ref<HTMLDivElement | null>(null);
const selectedElement = ref<BaseTable | null>(null);
const { updateDoc: updateFloor } = useFirestoreDoc<FloorDoc>({
    type: "get",
    path: `${Collection.FLOORS}/${props.floorID}`,
    onReceive(floor) {
        Loading.hide();
        if (!floor) {
            router.replace("/").catch(showErrorMessage);
        } else {
            instantiateFloor(floor);
        }
    },
    onError: () => Loading.hide(),
});

onMounted(() => {
    Loading.show();
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

function onFloorSave() {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as Floor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    return tryCatchLoadingWrapper(() => {
        return updateFloor({
            json: floorInstance.value?.canvas.toJSON(["name"]),
            name: floorInstance.value?.name,
            width: floorInstance.value?.width,
            height: floorInstance.value?.height,
        }).catch(showErrorMessage);
    });
}

function onFloorChange(prop: keyof Floor, event: string | number) {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.setFloorName(String(event));

    if (prop === "width" && typeof event === "number") {
        floorInstance.value.updateDimensions(event, floorInstance.value.height);
    }
    if (prop === "height" && typeof event === "number") {
        floorInstance.value.updateDimensions(floorInstance.value.width, event);
    }
}

function handleAddTableCallback(floor: Floor, { tag }: ElementDescriptor, [x, y]: NumberTuple) {
    return function addTable(label: string) {
        floor.addTableElement({ label, x, y, tag });
    };
}

function handleAddNewElement(floor: Floor, coords: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        // if (isWall(elementDescriptor)) return floor.addWall(coords);

        q.dialog({
            component: FTDialog,
            componentProps: {
                component: AddTableDialog,
                maximized: false,
                title: "Table ID",
                componentPropsObject: {
                    ids: extractAllTablesLabels(floor),
                },
                listeners: {
                    create: handleAddTableCallback(floor, elementDescriptor, coords),
                },
            },
        });
    };
}

function dblClickHandler(floor: Floor, coords: NumberTuple) {
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floor, coords));
}

async function elementClickHandler(_: Floor, element: BaseTable | null) {
    selectedElement.value = null;
    await nextTick();
    selectedElement.value = element;
}

function onDeleteElement(element: BaseTable) {
    element.canvas?.remove(element.canvas.getActiveObject());
    element.canvas?.renderAll();
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
        <ShowSelectedElement @delete="onDeleteElement" :selected-floor-element="selectedElement" />
        <div class="row q-pa-sm q-col-gutter-md" v-if="floorInstance">
            <div class="col-6">
                <q-badge color="secondary"> Width: {{ floorInstance.width }} (300 to 900) </q-badge>
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
                    Height: {{ floorInstance.height }} (300 to 900)
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