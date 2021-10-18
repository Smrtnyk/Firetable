<template>
    <div class="row q-pa-sm q-col-gutter-md">
        <div class="col-11 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="isRoundTableComp"
                        :model-value="getRoundTableRadiusComp"
                        disable
                        readonly
                        filled
                        label="Radius"
                    />
                    <q-input
                        v-else
                        :model-value="props.selectedFloorElement?.value?.width"
                        disable
                        readonly
                        filled
                        label="Width"
                    />
                </div>
                <div class="col-4 q-pa-xs" v-if="!isRoundTableComp">
                    <q-input
                        :model-value="props.selectedFloorElement?.value?.height"
                        disable
                        readonly
                        filled
                        label="Height"
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="props.selectedFloorElement?.value?.tableId"
                        :model-value="props.selectedFloorElement?.value.tableId"
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
                v-if="props.selectedFloorElement?.value"
                icon="trash"
                color="negative"
                stretch
                @click="deleteElement"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { BaseFloorElement, TableElement } from "src/types";
import type { Floor } from "src/floor-manager/Floor";
import { showConfirm } from "src/helpers/ui-helpers";
import { computed, Ref } from "vue";
import { getRoundTableRadius } from "src/floor-manager/utils";
import { isRoundTable } from "src/floor-manager/type-guards";

interface Props {
    selectedFloor: Ref<Floor> | null;
    selectedFloorElement: Ref<BaseFloorElement> | null;
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>();

const isRoundTableComp = computed(() => {
    return (
        props.selectedFloorElement?.value &&
        isRoundTable(props.selectedFloorElement.value)
    );
});

const getRoundTableRadiusComp = computed(() => {
    return (
        isRoundTableComp.value &&
        getRoundTableRadius(props.selectedFloorElement?.value as TableElement)
    );
});

async function deleteElement() {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        props.selectedFloor.value.removeElement(
            props.selectedFloorElement.value
        );
    }
}
</script>

<style scoped></style>
