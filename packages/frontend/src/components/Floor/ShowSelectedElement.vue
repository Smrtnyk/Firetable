<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="isSome(selectedElement)">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div
                    v-if="isSelectedElementRoundTable(selectedElement)"
                    class="col-4 q-pa-xs q-pl-none"
                >
                    <q-input
                        :model-value="selectedElement.unwrap().radius"
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
                        v-if="isSome(selectedElement) && selectedElement.unwrap().label"
                        :model-value="selectedElement.unwrap().label"
                        @update:model-value="updateTableLabel"
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="!isSome(selectedElement) || !selectedElement.unwrap().reservation"
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
import { BaseTable, isRoundTable, isTable, RoundTableElement } from "@firetable/floor-creator";
import { isNone, isSome, Option, Some } from "@firetable/types";

interface Props {
    selectedFloorElement: Option<BaseTable>;
}

const props = defineProps<Props>();
const emit = defineEmits(["delete"]);
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});

async function updateTableLabel(newId: string | number | null): Promise<void> {
    if (!selectedElement.value || !isSome(selectedElement.value) || !newId) return;
    if (!isTable(selectedElement.value.unwrap())) return;

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
        emit("delete", props.selectedFloorElement.unwrap());
    }
}

function getElementWidth(e: Some<BaseTable>): number {
    return Math.round((e.unwrap().group?.width || 0) * (e.unwrap().group?.scaleX || 0));
}

function getElementHeight(e: Some<BaseTable>): number {
    return Math.round((e.unwrap().group?.height || 0) * (e.unwrap().group?.scaleY || 0));
}

function isSelectedElementRoundTable(
    selectedElement: Option<BaseTable>
): selectedElement is Some<RoundTableElement> {
    if (!isSome(selectedElement)) {
        return false;
    }
    const element = selectedElement.unwrap();
    return isRoundTable(element) && !!element.radius;
}
</script>
