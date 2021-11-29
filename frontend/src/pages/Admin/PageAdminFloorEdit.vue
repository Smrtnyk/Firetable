<script setup lang="ts">
import AddTableDialog from "components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import FTDialog from "components/FTDialog.vue";

import { ElementTag, ElementType, FloorDoc } from "src/types/floor";
import { extractAllTablesLabels, hasFloorTables } from "src/floor-manager/filters";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/floor-manager/constants";
import { onMounted, ref } from "vue";
import { NumberTuple } from "src/types/generic";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { Collection } from "src/types/firebase";
import { Floor } from "src/floor-manager/Floor";
import { BaseTable, FloorMode } from "src/floor-manager/types";

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
    if (!canvasRef.value) return;

    floorInstance.value = new Floor({
        canvas: canvasRef.value,
        floorDoc,
        dblClickHandler,
        elementClickHandler,
        mode: FloorMode.EDITOR,
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
        }).catch(showErrorMessage);
    });
}

function onFloorChange(prop: keyof Floor, event: string | number) {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.setFloorName(String(event));
    //
    // if (prop === "width" || prop === "height") {
    //     floorInstance.value[prop] = Number(event);
    //     floorInstance.value.updateDimensions(floorInstance.value.width, floorInstance.value.height);
    // }
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

function elementClickHandler(_: Floor, element: BaseTable | null) {
    selectedElement.value = element;
}

function onDeleteElement(element: BaseTable) {
    element.canvas?.remove(element.canvas.getActiveObject());
    element.canvas?.renderAll();
}
</script>

<template>
    <div class="PageAdminFloorEdit">
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
                    :max="900"
                    :step="10"
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
                    :max="900"
                    :step="10"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange('height', event)"
                    :model-value="floorInstance.height"
                />
            </div>
        </div>

        <canvas ref="canvasRef" class="PageAdminFloorEdit__canvas shadow-3" />
    </div>
</template>

<style lang="scss">
.PageAdminFloorEdit {
    g.tableGroup.active rect,
    g.tableGroup.active circle {
        fill: #ff8a00 !important;
    }
    circle.bottom-right {
        stroke: #000;
        fill: #333;
    }
    // RESIZING WALL CONTROLS
    circle.bottom-right:hover {
        cursor: move;
        fill: #ff8a00;
    }
}
</style>
