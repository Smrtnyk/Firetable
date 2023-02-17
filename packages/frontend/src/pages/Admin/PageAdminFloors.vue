<script setup lang="ts">
import AddNewFloorForm from "components/Floor/AddNewFloorForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { Loading, useQuasar } from "quasar";
import { onMounted } from "vue";
import { makeRawFloor } from "@firetable/floor-creator";
import { Collection, FloorDoc } from "@firetable/types";
import { addFloor, deleteFloor } from "@firetable/backend";
import { useFirestoreCollection } from "src/composables/useFirestore";

const quasar = useQuasar();
const {
    data: floors,
    promise: floorsDataPromise,
    pending: isLoading,
} = useFirestoreCollection<FloorDoc>(Collection.FLOORS);

async function onFloorDelete(id: string, reset: () => void) {
    if (!(await showConfirm("Delete floor?"))) return reset();

    await tryCatchLoadingWrapper({
        hook: () => deleteFloor(id),
        errorHook: reset,
    });
}

function showAddNewFloorForm(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add New Floor",
            component: AddNewFloorForm,
            maximized: false,
            listeners: {
                create: function onFloorCreate(name: string) {
                    tryCatchLoadingWrapper({
                        hook: () => addFloor(makeRawFloor(name)).then(dialog.hide),
                    });
                },
            },
            componentPropsObject: {
                allFloorNames: new Set(floors.value.map(({ name }) => name)),
            },
        },
    });
}

onMounted(async () => {
    Loading.show();
    await floorsDataPromise.value;
    Loading.hide();
});
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle title="Floors">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showAddNewFloorForm"
                    label="new floor"
                />
            </template>
        </FTTitle>
        <q-list v-if="floors.length">
            <q-slide-item
                v-for="floor in floors"
                :key="floor.id"
                right-color="warning"
                @right="({ reset }) => onFloorDelete(floor.id, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
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

        <div
            class="justify-center items-center q-pa-md text-center"
            v-if="!floors.length && !isLoading"
        >
            <h6 class="text-h6">You should create some maps :)</h6>
            <q-btn rounded class="button-gradient q-mx-auto" v-close-popup size="lg">
                Get Started
            </q-btn>
            <q-img src="/no-map.svg" />
        </div>
    </div>
</template>
