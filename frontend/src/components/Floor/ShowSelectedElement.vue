<template>
    <div class="row q-pa-sm q-col-gutter-md">
        <div class="col-11 flex justify-between">
            <div class="row flex justify-between">
                <div class="col-4 q-pa-xs">
                    <q-input
                        :model-value="props.selectedFloorElement?.width"
                        disable
                        readonly
                        filled
                        label="Width"
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        :model-value="props.selectedFloorElement?.height"
                        disable
                        readonly
                        filled
                        label="Height"
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="props.selectedFloorElement?.tableId"
                        :model-value="props.selectedFloorElement?.tableId"
                        disable
                        readonly
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-1 flex">
            <q-btn
                icon="trash"
                color="negative"
                stretch
                @click="deleteElement"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { BaseFloorElement } from "src/types";
import type { Floor } from "src/floor-manager/Floor";
import { showConfirm } from "src/helpers/ui-helpers";

interface Props {
    selectedFloor: Floor | null;
    selectedFloorElement: BaseFloorElement | null;
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>();

async function deleteElement() {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        props.selectedFloor.removeElement(props.selectedFloorElement);
    }
}
</script>

<style scoped></style>
