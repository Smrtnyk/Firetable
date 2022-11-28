<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="isSome(selectedElement)">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div
                    v-if="isRoundTable(selectedElement.value) && selectedElement.value.radius"
                    class="col-4 q-pa-xs q-pl-none"
                >
                    <q-input
                        :model-value="selectedElement.value.radius"
                        filled
                        label="Radius"
                        readonly
                    />
                </div>
                <template v-else>
                    <div class="col-4 q-pa-xs q-pl-none">
                        <q-input
                            :model-value="getElementWidth(selectedElement)"
                            filled
                            label="Width"
                            readonly
                        />
                    </div>
                    <div class="col-4 q-pa-xs">
                        <q-input
                            :model-value="getElementHeight(selectedElement)"
                            filled
                            label="Height"
                            readonly
                        />
                    </div>
                </template>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="selectedElement.value.label"
                        :model-value="selectedElement.value.label"
                        @update:model-value="updateTableLabel"
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="!isSome(selectedElement) || !selectedElement.value.reservation"
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
import { BaseTable, isRoundTable, isTable } from "@firetable/floor-creator";
import { isNone, isSome, Option, Some } from "@firetable/types";

interface Props {
    selectedFloorElement: Option<BaseTable>;
}

const props = defineProps<Props>();
const emit = defineEmits(["delete"]);
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});

async function updateTableLabel(newId: string): Promise<void> {
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

async function deleteElement() {
    if (isNone(props.selectedFloorElement)) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", props.selectedFloorElement.value);
    }
}

function getElementWidth(e: any): number {
    return Math.round(e.group.width * e.group.scaleX);
}

function getElementHeight(e: Some<BaseTable>): number {
    return Math.round((e.value.group?.height || 0) * (e.value.group?.scaleY || 0));
}
</script>
