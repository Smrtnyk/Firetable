<script setup lang="ts">
import AddTableDialog from "components/Floor/AddTableDialog";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import { Floor } from "src/floor-manager/Floor";
import { BaseFloorElement, FloorDoc, FloorMode } from "src/types/floor";
import { extractAllTableIds, hasFloorTables } from "src/floor-manager/filters";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/floor-manager/constants";
import { onMounted, ref } from "vue";
import { isWall } from "src/floor-manager/type-guards";
import { NumberTuple } from "src/types/generic";
import { getFloor, saveFloor } from "src/services/firebase/db-floors";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

type ElementDescriptor = Pick<BaseFloorElement, "tag" | "type">;

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
const svgFloorContainer = ref<HTMLElement | null>(null);
const selectedElement = ref<BaseFloorElement | null>(null);
const selectedFloor = ref<Floor | null>(null);

async function loadFloor() {
    const floor = await tryCatchLoadingWrapper(() => getFloor(props.floorID));

    if (!floor) {
        await router.replace("/");
        return;
    }

    instantiateFloor(floor);
}

function instantiateFloor(floor: FloorDoc) {
    if (!svgFloorContainer.value) return;

    floorInstance.value = new Floor.Builder()
        .setFloorDocument(floor)
        .setMode(FloorMode.EDITOR)
        .setContainer(svgFloorContainer.value)
        .setElementClickHander(onElementClickHandler)
        .setFloorDoubleClickHandler(dblClickHandler)
        .build();
}

function onFloorSave() {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as Floor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    tryCatchLoadingWrapper(() => saveFloor(floorInstance.value as Floor)).catch(showErrorMessage);
}

function onFloorChange(prop: keyof Floor, event: string | number) {
    if (!floorInstance.value) return;

    if (prop === "name") floorInstance.value.changeName(String(event));

    if (prop === "width" || prop === "height") {
        floorInstance.value[prop] = Number(event);
        floorInstance.value.updateDimensions(floorInstance.value.width, floorInstance.value.height);
    }
}

function handleAddTableCallback(floor: Floor, { tag }: ElementDescriptor, [x, y]: NumberTuple) {
    return function addTable(tableId: string) {
        floor.addTableElement({ tableId, x, y, tag });
    };
}

function handleAddNewElement(floor: Floor, coords: NumberTuple) {
    return function ({ elementDescriptor }: BottomSheetTableClickResult) {
        if (isWall(elementDescriptor)) return floor.addWall(coords);

        q.dialog({
            component: AddTableDialog,
            componentProps: {
                ids: extractAllTableIds(floor),
            },
        }).onOk(handleAddTableCallback(floor, elementDescriptor, coords));
    };
}

function dblClickHandler(floor: Floor, coords: NumberTuple) {
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floor, coords));
}

function onElementClickHandler(floor: Floor | null, d: BaseFloorElement | null) {
    selectedFloor.value = floor;
    selectedElement.value = d;
}

onMounted(loadFloor);
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
        <show-selected-element
            :selected-floor="selectedFloor"
            :selected-floor-element="selectedElement"
        />
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

        <div ref="svgFloorContainer" class="PageAdminFloorEdit__svg-container eventFloor ft-card" />
    </div>
</template>

<style lang="scss">
.PageAdminFloorEdit {
    g.tableGroup.active rect,
    g.tableGroup.active circle {
        fill: #ff8a00 !important;
    }
    rect.wall {
        cursor: pointer;
    }
    line.horizontal,
    line.vertical {
        stroke: #444;
        stroke-width: 1px;
        shape-rendering: crispEdges;
    }
    // RESIZING WALL CONTROLS
    circle.bottomright:hover {
        cursor: move;
        fill: #ff8a00;
    }
}
</style>
