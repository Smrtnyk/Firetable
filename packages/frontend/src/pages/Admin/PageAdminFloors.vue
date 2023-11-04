<script setup lang="ts">
import AddNewFloorForm from "components/Floor/AddNewFloorForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { Loading, useQuasar } from "quasar";
import { makeRawFloor } from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";
import { addFloor, deleteFloor } from "@firetable/backend";
import { PropertyFloors, useFloors } from "src/composables/useFloors";
import { onMounted, ref, watch } from "vue";
import { takeProp } from "@firetable/utils";
import { useI18n } from "vue-i18n";
import FTCenteredText from "components/FTCenteredText.vue";

const quasar = useQuasar();
const { t } = useI18n();
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

function showAddNewFloorForm(propertyData: PropertyFloors, floorDocs: FloorDoc[]): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add New Floor",
            component: AddNewFloorForm,
            maximized: false,
            listeners: {
                create: function onFloorCreate(name: string) {
                    tryCatchLoadingWrapper({
                        hook: () =>
                            addFloor(
                                {
                                    organisationId: propertyData.organisationId,
                                    id: propertyData.propertyId,
                                },
                                makeRawFloor(name, propertyData.propertyId),
                            ).then(dialog.hide),
                    });
                },
            },
            componentPropsObject: {
                allFloorNames: new Set(floorDocs.map(takeProp("name"))),
            },
        },
    });
}

async function duplicateFloor(
    propertyData: PropertyFloors,
    floor: FloorDoc,
    reset: () => void,
): Promise<void> {
    if (
        !(await showConfirm(
            t("PageAdminFloors.duplicateFloorPlanMessage", { floorName: floor.name }),
        ))
    )
        return reset();

    const duplicatedFloor = { ...floor, name: `${floor.name}_copy` };
    await tryCatchLoadingWrapper({
        hook: () =>
            addFloor(
                {
                    organisationId: propertyData.organisationId,
                    id: propertyData.propertyId,
                },
                duplicatedFloor,
            ),
    }).finally(reset);
}

async function onFloorDelete(
    propertyData: PropertyFloors,
    id: string,
    reset: () => void,
): Promise<void> {
    if (!(await showConfirm(t("PageAdminFloors.deleteFloorMessage")))) return reset();

    await tryCatchLoadingWrapper({
        hook: () =>
            deleteFloor(
                {
                    organisationId: propertyData.organisationId,
                    id: propertyData.propertyId,
                },
                id,
            ),
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
        <FTTitle :title="t('PageAdminFloors.title')" />

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
                <div class="add-floor-btn row justify-end">
                    <q-btn
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="showAddNewFloorForm(propertyData, propertyData.floors)"
                    />
                </div>
                <!-- If the property has floors, display them -->
                <q-list v-if="propertyData.floors.length">
                    <q-slide-item
                        v-for="floor in propertyData.floors"
                        :key="floor.id"
                        right-color="red"
                        left-color="green"
                        @right="({ reset }) => onFloorDelete(propertyData, floor.id, reset)"
                        @left="({ reset }) => duplicateFloor(propertyData, floor, reset)"
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
                                    floorId: floor.id,
                                    organisationId: propertyData.organisationId,
                                    propertyId: propertyData.propertyId,
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
                <FTCenteredText v-else>
                    {{ t("PageAdminFloors.noFloorPlansMessage") }}
                </FTCenteredText>
            </q-tab-panel>
        </q-tab-panels>

        <!-- Show "no properties" message when there are no properties and isLoading is false -->
        <FTCenteredText v-if="!Object.keys(floors).length && !isLoading">
            {{ t("PageAdminFloors.noPropertiesMessage") }}
        </FTCenteredText>
    </div>
</template>
