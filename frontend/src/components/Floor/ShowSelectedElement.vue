<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="selectedElement">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        :model-value="selectedElement.width"
                        filled
                        label="Width"
                        type="number"
                        step="5"
                        @keydown.prevent="() => false"
                        @update:model-value="(val) => updateElementProp('width', Number(val))"
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
                        @update:model-value="(val) => updateElementProp('height', Number(val))"
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
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, nextTick } from "vue";
import { isRoundTable, isTable } from "src/floor-manager/type-guards";
import { BaseTable } from "src/floor-manager/types";

interface Props {
    selectedFloorElement: BaseTable | null;
}

const props = defineProps<Props>();
const emit = defineEmits(["delete"]);
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});
const isRoundTableComp = computed(() => {
    return props.selectedFloorElement && isRoundTable(props.selectedFloorElement);
});

async function updateTableId(newId: string): Promise<void> {
    if (!selectedElement.value || !newId) return;
    if (!isTable(selectedElement.value)) return;

    try {
        // props.selectedElement.canvas.updateTableId(selectedElement.value, newId);
        // selectedElement.value["tableId"] = newId;
    } catch {
        await nextTick();
        showErrorMessage("Table Id already taken");
    }
}

function updateElementProp<T extends keyof any>(prop: T, val: any): void {
    // if (!props.selectedFloor || !selectedElement.value) return;
    // props.selectedFloor.updateElementProperty(selectedElement.value, prop, val);
    // selectedElement.value[prop] = val;
}

async function deleteElement() {
    if (!props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", props.selectedFloorElement);
    }
}
</script>
