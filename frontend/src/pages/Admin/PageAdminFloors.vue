<script setup lang="ts">
import AddNewFloorForm from "components/Floor/AddNewFloorForm.vue";
import FTTitle from "components/FTTitle.vue";

import { makeRawFloor } from "src/floor-manager/factories";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ref } from "vue";
import { deleteFloor, addFloor } from "src/services/firebase/db-floors";
import { useFirestore } from "src/composables/useFirestore";
import { Collection } from "src/types/firebase";
import { FloorDoc } from "src/types/floor";
import { useFloorsStore } from "src/stores/floors-store";

const floorsStore = useFloorsStore();
const showCreateFloorForm = ref(false);
const { data: floors, loading: isLoading } = useFirestore<FloorDoc>({
    type: "watch",
    queryType: "collection",
    path: Collection.FLOORS,
});

async function onFloorDelete({ id }: Pick<FloorDoc, "id">, reset: () => void) {
    if (!(await showConfirm("Delete floor?"))) return reset();

    await tryCatchLoadingWrapper(
        async () => {
            await deleteFloor(id);
            floors.value = floors.value.filter((floor) => floor.id !== id);
        },
        [],
        reset
    );
}

async function onAddNewFloor({ name }: Pick<FloorDoc, "name">) {
    const newFloor = makeRawFloor(name);
    await tryCatchLoadingWrapper(async () => {
        await addFloor(newFloor);
        showCreateFloorForm.value = false;
    });
}
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle title="Floors">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="floorsStore.toggleCreateFloorModalVisibility"
                    label="new floor"
                />
            </template>
        </FTTitle>
        <q-list v-if="floors.length">
            <q-slide-item
                v-for="floor in floors"
                :key="floor.id"
                right-color="warning"
                @right="({ reset }) => onFloorDelete(floor, reset)"
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
            <q-img src="no-map.svg" />
        </div>

        <AddNewFloorForm @create="onAddNewFloor" />
    </div>
</template>
