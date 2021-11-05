<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="props.selectedFloorElement">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        v-if="isRoundTableComp"
                        :model-value="getRoundTableRadiusComp"
                        filled
                        label="Radius"
                        @update:model-value="(event) => updateTableProp('radius', event)"
                    />
                    <q-input
                        v-else
                        :model-value="props.selectedFloorElement.width"
                        filled
                        label="Width"
                        type="number"
                        step="5"
                        @keydown.prevent="() => false"
                        @update:model-value="(val) => updateTableProp('width', val)"
                    />
                </div>
                <div class="col-4 q-pa-xs" v-if="!isRoundTableComp">
                    <q-input
                        :model-value="props.selectedFloorElement.height"
                        filled
                        label="Height"
                        type="number"
                        step="5"
                        @keydown.prevent="() => false"
                        @update:model-value="(val) => updateTableProp('height', val)"
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="props.selectedFloorElement.tableId"
                        :model-value="props.selectedFloorElement.tableId"
                        disable
                        readonly
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="props.selectedFloorElement"
                icon="trash"
                color="negative"
                @click="deleteElement"
            />
        </div>
    </div>
    <div class="row q-pa-sm" v-else>
        <div class="col q-pa-xs">
            <q-input model-value="No element selected..." disable readonly filled autogrow />
        </div>
    </div>
</template>

<script setup lang="ts">
import { BaseFloorElement, TableElement } from "src/types/floor";
import type { Floor } from "src/floor-manager/Floor";
import { showConfirm } from "src/helpers/ui-helpers";
import { computed, Ref } from "vue";
import { getRoundTableRadius } from "src/floor-manager/utils";
import { isRoundTable } from "src/floor-manager/type-guards";

interface Props {
    selectedFloor: Floor | null;
    selectedFloorElement: BaseFloorElement | null;
}

const props = defineProps<Props>();

const isRoundTableComp = computed(() => {
    return props.selectedFloorElement && isRoundTable(props.selectedFloorElement);
});

const getRoundTableRadiusComp = computed(() => {
    return (
        isRoundTableComp.value && getRoundTableRadius(props.selectedFloorElement as TableElement)
    );
});

function updateTableProp(prop: keyof BaseFloorElement, val: string | number): void {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    props.selectedFloor.updateElementProperty(props.selectedFloorElement, prop, val);
}

async function deleteElement() {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        props.selectedFloor.removeElement(props.selectedFloorElement);
    }
}
</script>
