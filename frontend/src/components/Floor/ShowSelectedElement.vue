<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="selectedElement">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        v-if="isRoundTableComp"
                        :model-value="getRoundTableRadiusComp"
                        filled
                        label="Radius"
                        @update:model-value="(event) => updateElementProp('radius', event)"
                    />
                    <q-input
                        v-else
                        :model-value="selectedElement.width"
                        filled
                        label="Width"
                        type="number"
                        step="5"
                        @keydown.prevent="() => false"
                        @update:model-value="(val) => updateElementProp('width', val)"
                    />
                </div>
                <div class="col-4 q-pa-xs" v-if="!isRoundTableComp">
                    <q-input
                        :model-value="selectedElement.height"
                        filled
                        label="Height"
                        type="number"
                        step="5"
                        @keydown.prevent="() => false"
                        @update:model-value="(val) => updateElementProp('height', val)"
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="selectedElement.tableId"
                        :model-value="selectedElement.tableId"
                        @update:model-value="updateTableId"
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="!selectedElement.reservation"
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
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, nextTick } from "vue";
import { getRoundTableRadius } from "src/floor-manager/utils";
import { isRoundTable, isTable } from "src/floor-manager/type-guards";

interface Props {
    selectedFloor: Floor | null;
    selectedFloorElement: BaseFloorElement | null;
}

const props = defineProps<Props>();
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});
const isRoundTableComp = computed(() => {
    return props.selectedFloorElement && isRoundTable(props.selectedFloorElement);
});
const getRoundTableRadiusComp = computed(() => {
    return (
        isRoundTableComp.value && getRoundTableRadius(props.selectedFloorElement as TableElement)
    );
});

async function updateTableId(newId: string): Promise<void> {
    if (!props.selectedFloor || !selectedElement.value || !newId) return;
    if (!isTable(selectedElement.value)) return;

    try {
        props.selectedFloor.updateTableId(selectedElement.value, newId);
        selectedElement.value["tableId"] = newId;
    } catch {
        await nextTick();
        showErrorMessage("Table Id already taken");
    }
}

function updateElementProp<T extends keyof BaseFloorElement>(
    prop: T,
    val: BaseFloorElement[T]
): void {
    if (!props.selectedFloor || !selectedElement.value) return;
    props.selectedFloor.updateElementProperty(selectedElement.value, prop, val);
    selectedElement.value[prop] = val;
}

async function deleteElement() {
    if (!props.selectedFloor || !props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        props.selectedFloor.removeElement(props.selectedFloorElement);
    }
}
</script>
