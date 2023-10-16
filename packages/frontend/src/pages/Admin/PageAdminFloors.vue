<script setup lang="ts">
import AddNewFloorForm from "components/Floor/AddNewFloorForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { Loading, useQuasar } from "quasar";
import { makeRawFloor } from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";
import { addFloor, deleteFloor } from "@firetable/backend";
import { useFloors } from "src/composables/useFloors";
import { onMounted, ref, watch } from "vue";
import { takeProp } from "@firetable/utils";

const quasar = useQuasar();
const { floors, isLoading, loadingPromise } = useFloors();
const activeTab = ref("");

watch(
    floors,
    (newFloors) => {
        if (Object.keys(newFloors).length && !activeTab.value) {
            activeTab.value = Object.keys(newFloors)[0];
        }
    },
    { immediate: true, deep: true },
);

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

async function duplicateFloor(floor: FloorDoc, reset: () => void) {
    if (!(await showConfirm(`Are you sure you want to duplicate "${floor.name}" floor plan?`)))
        return reset();

    const duplicatedFloor = { ...floor, name: `${floor.name}_copy` };
    return tryCatchLoadingWrapper({
        hook: () => addFloor(duplicatedFloor),
    }).finally(reset);
}

async function onFloorDelete(id: string, reset: () => void) {
    if (!(await showConfirm("Delete floor?"))) return reset();

    await tryCatchLoadingWrapper({
        hook: () => deleteFloor(id),
        errorHook: reset,
    });
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

        <!-- Tabs for each property -->
        <q-tabs v-model="activeTab">
            <q-tab
                v-for="(propertyData, propertyKey) in floors"
                :key="propertyKey"
                :name="propertyKey"
                :label="propertyData.propertyName"
            />
        </q-tabs>

        <!-- Tab panels for each property's floors -->
        <q-tab-panels v-model="activeTab">
            <q-tab-panel
                v-for="(propertyData, propertyKey) in floors"
                :key="propertyKey"
                :name="propertyKey"
            >
                <!-- Button to add a new floor for the property in the active tab -->
                <div class="add-floor-btn row">
                    <q-btn
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="showAddNewFloorForm(propertyData.propertyId, propertyData.floors)"
                        :label="`Add New Floor to ${propertyData.propertyName}`"
                    />
                </div>
                <!-- If the property has floors, display them -->
                <q-list v-if="propertyData.floors.length">
                    <q-slide-item
                        v-for="floor in propertyData.floors"
                        :key="floor.id"
                        right-color="red"
                        left-color="green"
                        @right="({ reset }) => onFloorDelete(floor.id, reset)"
                        @left="({ reset }) => duplicateFloor(floor, reset)"
                        class="fa-card"
                    >
                        <template #right>
                            <q-icon name="trash" />
                        </template>
                        <template #left>
                            <q-icon name="copy" />
                        </template>
                        <q-item
                            v-ripple
                            clickable
                            :to="{
                                name: 'adminFloorEdit',
                                params: {
                                    floorID: floor.id,
                                },
                            }"
                        >
                            <q-item-section>
                                <q-item-label>{{ floor.name }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-slide-item>
                </q-list>

                <!-- If the property doesn't have floors, display a standout message -->
                <div v-else class="row justify-center items-center q-mt-md">
                    <h6 class="q-ma-sm text-weight-bolder underline">
                        This property has no floors.
                    </h6>
                </div>
            </q-tab-panel>
        </q-tab-panels>

        <!-- Show "no properties" message when there are no properties and isLoading is false -->
        <div
            v-if="!Object.keys(floors).length && !isLoading"
            class="justify-center items-center q-pa-md text-center"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                You have no properties created, in order to create floor plans you need to first
                create at least one property.
            </h6>
        </div>
    </div>
</template>
