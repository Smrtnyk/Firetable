import "./PageAdminFloorEdit.scss";

import AddTableDialog from "components/Floor/AddTableDialog";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import { Floor } from "src/floor-manager/Floor";
import { BaseFloorElement, FloorDoc, FloorMode } from "src/types";
import {
    extractAllTableIds,
    getTable,
    hasFloorTables,
} from "src/floor-manager/filters";
import {
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/floor-manager/constants";
import { defineComponent, onMounted, ref } from "vue";
import { isTable, isWall } from "src/floor-manager/type-guards";
import { NumberTuple } from "src/types/generic";
import { getFloor, saveFloor } from "src/services/firebase/db-floors";
import { useRouter } from "vue-router";
import { QBadge, QBtn, QInput, QSlider, useQuasar } from "quasar";

type ElementDescriptor = Pick<BaseFloorElement, "tag" | "type">;

interface BottomSheetTableClickResult {
    elementDescriptor: ElementDescriptor;
}

const addNewElementsBottomSheetOptions = {
    message: "Choose action",
    grid: true,
    actions: ELEMENTS_TO_ADD_COLLECTION,
};

export default defineComponent({
    name: "PageFloorManager",

    components: { QInput, QBtn, QBadge, QSlider, ShowSelectedElement },

    props: {
        floorID: {
            type: String,
            required: true,
        },
    },

    setup(props) {
        const router = useRouter();
        const q = useQuasar();

        const floorInstance = ref<Floor | null>(null);
        const svgFloorContainer = ref<HTMLElement | null>(null);
        const selectedElement = ref<BaseFloorElement | null>(null);
        const selectedFloor = ref<Floor | null>(null);

        async function loadFloor() {
            const floor = await tryCatchLoadingWrapper(() =>
                getFloor(props.floorID)
            );

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
            if (
                !floorInstance.value ||
                !hasFloorTables(floorInstance.value as Floor)
            ) {
                return showErrorMessage("You need to add at least one table!");
            }

            void tryCatchLoadingWrapper(() =>
                saveFloor(floorInstance.value as Floor)
            );
        }

        function onFloorChange(prop: keyof Floor, event: string | number) {
            if (!floorInstance.value) return;

            if (prop === "name") floorInstance.value.changeName(String(event));

            if (prop === "width" || prop === "height") {
                floorInstance.value[prop] = Number(event);
                floorInstance.value.updateDimensions(
                    floorInstance.value.width,
                    floorInstance.value.height
                );
            }
        }

        function handleAddTableCallback(
            floor: Floor,
            { tag }: ElementDescriptor,
            [x, y]: NumberTuple
        ) {
            return function addTable(tableId: string) {
                floor.addTableElement({ tableId, x, y, tag });
            };
        }

        function handleAddNewElement(floor: Floor, coords: NumberTuple) {
            return function ({
                elementDescriptor,
            }: BottomSheetTableClickResult) {
                if (isWall(elementDescriptor)) return floor.addWall(coords);

                q.dialog({
                    component: AddTableDialog,
                    componentProps: {
                        ids: extractAllTableIds(floor),
                    },
                }).onOk(
                    handleAddTableCallback(floor, elementDescriptor, coords)
                );
            };
        }

        function dblClickHandler(floor: Floor, coords: NumberTuple) {
            q.bottomSheet(addNewElementsBottomSheetOptions).onOk(
                handleAddNewElement(floor, coords)
            );
        }

        function onElementClickHandler(
            floor: Floor | null,
            d: BaseFloorElement | null
        ) {
            selectedFloor.value = floor;
            selectedElement.value = d;
        }

        onMounted(loadFloor);

        return () => {
            if (!props.floorID) {
                return <div />;
            }

            return (
                <div class="PageAdminFloorEdit">
                    {!!floorInstance.value && (
                        <>
                            <div class="PageAdminFloorEdit__controls justify-between">
                                <q-input
                                    standout
                                    rounded
                                    label="Floor name"
                                    {...{
                                        "onUpdate:modelValue":
                                            onFloorChange.bind(null, "name"),
                                    }}
                                    model-value={floorInstance.value.name}
                                >
                                    {{
                                        append: () => (
                                            <q-btn
                                                class="button-gradient"
                                                icon="save"
                                                onClick={onFloorSave}
                                                label="save"
                                                size="md"
                                                rounded
                                            />
                                        ),
                                    }}
                                </q-input>
                            </div>
                            <show-selected-element
                                selectedFloor={selectedFloor}
                                selectedFloorElement={selectedElement}
                            />
                            <div class="row q-pa-sm q-col-gutter-md">
                                <div class="col-6">
                                    <q-badge color="secondary">
                                        Width: {floorInstance.value.width} (300
                                        to 900)
                                    </q-badge>
                                    <q-slider
                                        model-value={floorInstance.value.width}
                                        min={300}
                                        max={900}
                                        step={10}
                                        label
                                        color="deep-orange"
                                        {...{
                                            "onUpdate:modelValue":
                                                onFloorChange.bind(
                                                    null,
                                                    "width"
                                                ),
                                        }}
                                    />
                                </div>
                                <div class="col-6">
                                    <q-badge color="secondary">
                                        Height: {floorInstance.value.height}{" "}
                                        (300 to 900)
                                    </q-badge>
                                    <q-slider
                                        min={300}
                                        max={900}
                                        step={10}
                                        label
                                        color="deep-orange"
                                        {...{
                                            "onUpdate:modelValue":
                                                onFloorChange.bind(
                                                    null,
                                                    "height"
                                                ),
                                        }}
                                        model-value={floorInstance.value.height}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div
                        ref={svgFloorContainer}
                        class="PageAdminFloorEdit__svg-container ft-card"
                    />
                </div>
            );
        };
    },
});
