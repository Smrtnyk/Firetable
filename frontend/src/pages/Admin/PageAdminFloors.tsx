import AddNewFloorForm from "src/components/Floor/AddNewFloorForm";
import { FTTitle } from "components/FTTitle";

import { makeRawFloor } from "src/floor-manager/factories";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";

import { defineComponent, ref, withDirectives } from "vue";

import { FloorDoc, Collection } from "src/types";
import { deleteFloor, saveFloor } from "src/services/firebase/db-floors";
import { useFirestore } from "src/composables/useFirestore";

import {
    QDialog,
    QBtn,
    QItem,
    QItemLabel,
    QItemSection,
    QList,
    QSlideItem,
    QIcon,
    Ripple,
    QImg,
} from "quasar";

export default defineComponent({
    name: "PageAdminFloors",

    components: {
        FTTitle,
        AddNewFloorForm,
        QDialog,
        QBtn,
        QItem,
        QItemLabel,
        QItemSection,
        QList,
        QSlideItem,
        QIcon,
        QImg,
    },

    setup() {
        const showCreateFloorForm = ref(false);
        const { data: floors, loading: isLoading } = useFirestore<FloorDoc>({
            type: "get",
            queryType: "collection",
            path: Collection.FLOORS,
        });

        async function onFloorDelete(
            { id }: Pick<FloorDoc, "id">,
            reset: () => void
        ) {
            if (!(await showConfirm("Delete floor?"))) return reset();

            await tryCatchLoadingWrapper(
                async () => {
                    await deleteFloor(id);
                    floors.value = floors.value.filter(
                        (floor) => floor.id !== id
                    );
                },
                [],
                reset
            );
        }

        async function onAddNewFloor({ name }: Pick<FloorDoc, "name">) {
            const newFloor = makeRawFloor(name);
            await tryCatchLoadingWrapper(async () => {
                await saveFloor(newFloor);
                showCreateFloorForm.value = false;
            });
        }

        return () => (
            <div class="PageAdminFloors">
                <f-t-title title="Floors">
                    {{
                        right: () => (
                            <q-btn
                                rounded
                                icon="plus"
                                class="button-gradient"
                                onClick={() =>
                                    (showCreateFloorForm.value = !showCreateFloorForm.value)
                                }
                                label="new floor"
                            />
                        ),
                    }}
                </f-t-title>

                {!!floors.value.length && (
                    <q-list>
                        {floors.value.map((floor) => (
                            <q-slide-item
                                key={floor.id}
                                right-color="warning"
                                onRight={({ reset }: any) =>
                                    onFloorDelete(floor, reset)
                                }
                                class="fa-card"
                            >
                                {{
                                    right: () => <q-icon name="trash" />,
                                    default: () =>
                                        withDirectives(
                                            <q-item
                                                clickable
                                                to={{
                                                    name: "adminFloorEdit",
                                                    params: {
                                                        floorID: floor.id,
                                                    },
                                                }}
                                            >
                                                <q-item-section>
                                                    <q-item-label>
                                                        {floor.name}
                                                    </q-item-label>
                                                </q-item-section>
                                            </q-item>,
                                            [[Ripple, 1]]
                                        ),
                                }}
                            </q-slide-item>
                        ))}
                    </q-list>
                )}

                {!floors.value.length && !isLoading.value && (
                    <div class="justify-center items-center q-pa-md text-center">
                        <h6 class="text-h6">You should create some maps :)</h6>
                        <q-btn
                            rounded
                            class="button-gradient q-mx-auto"
                            onClick={() =>
                                (showCreateFloorForm.value = !showCreateFloorForm.value)
                            }
                            size="lg"
                        >
                            Get Started
                        </q-btn>
                        <q-img src="no-map.svg" />
                    </div>
                )}

                <q-dialog v-model={showCreateFloorForm.value}>
                    <add-new-floor-form onCreate={onAddNewFloor} />
                </q-dialog>
            </div>
        );
    },
});
