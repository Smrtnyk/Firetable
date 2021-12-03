<template>
    <div class="Fabric" ref="fabricComponent">
        <q-btn label="save canvas" @click="saveCanvas" />
        <ShowSelectedElement
            :selected-floor-element="selectedFloorElement"
            :selected-floor="null"
            @delete="onElementDelete"
        />
        <canvas id="floor-canvas" ref="floorCanvas" class="Fabric__canvas shadow-3" />
    </div>
</template>

<script lang="ts" setup>
import { useQuasar } from "quasar";
import { ref } from "vue";
import { Floor } from "src/floor-manager/Floor";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { BaseFloorElement, FloorDoc } from "src/types/floor";
import { NumberTuple } from "src/types/generic";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/floor-manager/constants";
import { loadingWrapper } from "src/helpers/ui-helpers";

import FTDialog from "components/FTDialog.vue";
import AddTableDialog from "components/Floor/AddTableDialog.vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";

type ElementDescriptor = Pick<BaseFloorElement, "tag" | "type">;

interface BottomSheetTableClickResult {
    elementDescriptor: ElementDescriptor;
}

const quasar = useQuasar();
const floorCanvas = ref<null | HTMLCanvasElement>(null);
let floor: Floor | null = null;

const selectedFloorElement = ref<any>(null);

const addNewElementsBottomSheetOptions = {
    message: "Choose action",
    grid: true,
    actions: ELEMENTS_TO_ADD_COLLECTION,
};

const { updateDoc } = useFirestoreDoc<FloorDoc>({
    type: "watch",
    path: "fabric/da",
    onReceive: initFabric,
});

function onElementDelete(element: any) {
    element.canvas.remove(element.canvas.getActiveObject());
    selectedFloorElement.value = null;
}

function dblClickHandler(floor: Floor, coords: NumberTuple) {
    quasar.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floor, coords));
}

function elementClickHandler(element: any) {
    selectedFloorElement.value = element;
}

function handleAddTableCallback(floor: Floor, { tag }: ElementDescriptor, [x, y]: NumberTuple) {
    return function addTable(tableId: string) {
        floor.addTableElement({ label: tableId, x, y, tag });
    };
}

function handleAddNewElement(floor: Floor, coords: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        // if (isWall(elementDescriptor)) return floor.addWall(coords);

        quasar.dialog({
            component: FTDialog,
            componentProps: {
                component: AddTableDialog,
                maximized: false,
                title: "Table ID",
                componentPropsObject: {
                    // ids: extractAllTableIds(floor),
                    ids: [],
                },
                listeners: {
                    create: handleAddTableCallback(floor, elementDescriptor, coords),
                },
            },
        });
    };
}

const saveCanvas = loadingWrapper(async () => {
    if (!floor) return;
    console.log(floor.canvas.toJSON());
    await updateDoc({
        json: floor.canvas.toJSON(),
        width: 1000,
        height: 1000,
    });
});

function startNewFloor(): void {
    if (!floorCanvas.value) return;
    floor = new Floor({
        canvas: floorCanvas.value,
        floorDoc: {
            id: "da",
            name: "sdasd",
            width: 1000,
            height: 1000,
            data: [],
        },
        dblClickHandler: dblClickHandler,
        elementClickHandler,
    });
}

function initFabric(floorDoc: FloorDoc | undefined) {
    if (!floorCanvas.value) return;
    if (!floorDoc) {
        startNewFloor();
    } else if (floor) {
        floor.updateData(floorDoc);
    } else {
        floor = new Floor({
            canvas: floorCanvas.value,
            floorDoc,
            dblClickHandler: dblClickHandler,
            elementClickHandler,
        });
    }
}
</script>

<style lang="scss">
.Fabric {
    &__canvas {
        width: 100%;
    }
}
</style>
