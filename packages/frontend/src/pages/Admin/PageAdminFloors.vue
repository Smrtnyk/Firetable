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
import { takeProp } from "@firetable/utils";
import { useRouter } from "vue-router";

const quasar = useQuasar();
const router = useRouter();
const {
    data: floors,
    promise: floorsDataPromise,
    pending: isLoading,
} = useFirestoreCollection<FloorDoc>(Collection.FLOORS);

async function onFloorDelete(id: string) {
    if (!(await showConfirm("Delete floor?"))) return;

    await tryCatchLoadingWrapper({
        hook: () => deleteFloor(id),
        errorHook: showErrorMessage,
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
                allFloorNames: new Set(floors.value.map(takeProp("name"))),
            },
        },
    });
}

function duplicateFloor() {
    // handle duplication here
}

function onFloorItemClick(floorId: string) {
    const actions = [
        {
            label: "Delete",
            icon: "trash",
            handler: () => onFloorDelete(floorId),
        },
        {
            label: "Duplicate",
            icon: "copy",
            handler: () => duplicateFloor(),
        },
    ];

    quasar
        .bottomSheet({
            message: "Choose action",
            grid: true,
            actions,
        })
        .onOk(function (action) {
            action.handler(floorId);
        });
}

let pressTimer: number | null = null;
let longPressTriggered = false;

function handleMouseDown(floorId: string) {
    longPressTriggered = false;
    pressTimer = setTimeout(() => {
        longPressTriggered = true;
        onFloorItemClick(floorId);
    }, 1000); // 1000ms = 1s long press
}

function handleMouseUp(floorId: string) {
    if (pressTimer !== null) clearTimeout(pressTimer);
    if (!longPressTriggered) {
        // Navigate using the router if the long press hasn't been triggered
        router.push({
            name: "adminFloorEdit",
            params: { floorID: floorId },
        });
    }
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
        <q-list v-if="floors.length" bordered separator>
            <q-item
                v-for="floor in floors"
                :key="floor.id"
                @mousedown="() => handleMouseDown(floor.id)"
                @mouseup="() => handleMouseUp(floor.id)"
                @touchstart="() => handleMouseDown(floor.id)"
                @touchend="() => handleMouseUp(floor.id)"
                clickable
                v-ripple
            >
                <q-item-section>
                    <q-item-label>{{ floor.name }}</q-item-label>
                </q-item-section>
            </q-item>
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
