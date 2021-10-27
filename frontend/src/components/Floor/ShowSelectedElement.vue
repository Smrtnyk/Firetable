<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="props.selectedFloorElement?.value">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        v-if="isRoundTableComp"
                        :model-value="getRoundTableRadiusComp"
                        filled
                        label="Radius"
                        @update:model-value="updateTableProp.bind('radius')"
                    />
                    <q-input
                        v-else
                        :model-value="props.selectedFloorElement?.value?.width"
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
                        :model-value="props.selectedFloorElement?.value?.height"
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
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="props.selectedFloorElement?.value"
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
    selectedFloor: Ref<Floor> | null;
    selectedFloorElement: Ref<BaseFloorElement> | null;
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>();

const isRoundTableComp = computed(() => {
    return props.selectedFloorElement?.value && isRoundTable(props.selectedFloorElement.value);
});

const getRoundTableRadiusComp = computed(() => {
    return (
        isRoundTableComp.value &&
        getRoundTableRadius(props.selectedFloorElement?.value as TableElement)
    );
});

function updateTableProp(prop: keyof BaseFloorElement, val: string | number): void {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    props.selectedFloor.value.updateElementProperty(props.selectedFloorElement.value, prop, val);
}

async function deleteElement() {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        props.selectedFloor.value.removeElement(props.selectedFloorElement.value);
    }
}
</script>
