<script setup lang="ts">
import AddNewFloorForm from "components/Floor/AddNewFloorForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { Loading, useQuasar } from "quasar";
import { makeRawFloor } from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";
import { addFloor, deleteFloor } from "@firetable/backend";
import { useRouter } from "vue-router";
import { useFloors } from "src/composables/useFloors";
import { onMounted } from "vue";
import { takeProp } from "@firetable/utils";

const quasar = useQuasar();
const router = useRouter();
const { floors, isLoading, loadingPromise } = useFloors();

async function onFloorDelete(id: string) {
    if (!(await showConfirm("Delete floor?"))) return;

    await tryCatchLoadingWrapper({
        hook: () => deleteFloor(id),
        errorHook: showErrorMessage,
    });
}

function showAddNewFloorForm(propertyId: string, floors: FloorDoc[]): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add New Floor",
            component: AddNewFloorForm,
            maximized: false,
            listeners: {
                create: function onFloorCreate(name: string) {
                    tryCatchLoadingWrapper({
                        hook: () => addFloor(makeRawFloor(name, propertyId)).then(dialog.hide),
                    });
                },
            },
            componentPropsObject: {
                allFloorNames: new Set(floors.map(takeProp("name"))),
            },
        },
    });
}

function duplicateFloor(floor: FloorDoc) {
    const duplicatedFloor = { ...floor, name: `${floor.name}_copy` };
    return tryCatchLoadingWrapper({
        hook: () => addFloor(duplicatedFloor),
    });
}

function onFloorItemClick(floor: FloorDoc) {
    const actions = [
        {
            label: "Delete",
            icon: "trash",
            handler: () => onFloorDelete(floor.id),
        },
        {
            label: "Duplicate",
            icon: "copy",
            handler: () => duplicateFloor(floor),
        },
    ];

    quasar
        .bottomSheet({
            message: "Choose action",
            grid: true,
            actions,
        })
        .onOk(function (action) {
            action.handler(floor);
        });
}

let pressTimer: number | null = null;
let longPressTriggered = false;

function handleMouseDown(floor: FloorDoc) {
    longPressTriggered = false;
    pressTimer = setTimeout(() => {
        longPressTriggered = true;
        onFloorItemClick(floor);
    }, 1000); // 1000ms = 1s long press
}

function handleMouseUp(floor: FloorDoc) {
    if (pressTimer !== null) clearTimeout(pressTimer);
    if (!longPressTriggered) {
        // Navigate using the router if the long press hasn't been triggered
        router.push({
            name: "adminFloorEdit",
            params: { floorID: floor.id },
        });
    }
}

onMounted(async () => {
    Loading.show();
    await loadingPromise;
    Loading.hide();
});
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle title="Floors" />

        <!-- Outer loop for properties -->
        <div v-for="(propertyData, propertyKey) in floors" :key="propertyKey">
            <!-- Display property name -->
            <div class="property-title text-h5 q-mt-md">
                {{ propertyData.propertyName }}
            </div>

            <div class="q-mb-md">
                <!-- If the property has floors, display them -->
                <q-list v-if="propertyData.floors.length" bordered separator>
                    <!-- Inner loop for floors of the current property -->
                    <q-item
                        v-for="floor in propertyData.floors"
                        :key="floor.id"
                        @mousedown="() => handleMouseDown(floor)"
                        @mouseup="() => handleMouseUp(floor)"
                        @touchstart="() => handleMouseDown(floor)"
                        @touchend="() => handleMouseUp(floor)"
                        clickable
                        v-ripple
                    >
                        <q-item-section>
                            <q-item-label>{{ floor.name }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>

                <!-- If the property doesn't have floors, display a standout message -->
                <div v-else class="no-floor-message text-h6 bg-grey-9 q-pa-sm rounded-borders">
                    This property has no floors.
                </div>
            </div>
            <!-- Button to add a new floor for every property -->
            <div class="add-floor-btn row justify-end">
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showAddNewFloorForm(propertyData.propertyId, propertyData.floors)"
                    label="Add New Floor"
                />
            </div>
        </div>

        <!-- Show "no properties" message when there are no properties and isLoading is false -->
        <div
            v-if="!Object.keys(floors).length && !isLoading"
            class="justify-center items-center q-pa-md text-center"
        >
            <h6 class="text-h6">
                You have no properties created, in order to create floor plans you need to first
                create at least one property. :)
            </h6>
            <q-img src="/no-map.svg" />
        </div>
    </div>
</template>
