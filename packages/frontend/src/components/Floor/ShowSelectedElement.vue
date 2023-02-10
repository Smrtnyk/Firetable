<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="selectedElement">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div
                    v-if="isSelectedElementRoundTable(selectedElement)"
                    class="col-4 q-pa-xs q-pl-none"
                >
                    <q-input :model-value="selectedElement.radius" filled label="Radius" readonly />
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
                        v-if="selectedElement?.label"
                        :model-value="selectedElement.label"
                        @update:model-value="updateTableLabel"
                        filled
                        label="Table Name"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="!selectedElement || !selectedElement.reservation"
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

interface Props {
    selectedFloorElement: BaseTable | null;
}

const props = defineProps<Props>();
const emit = defineEmits(["delete"]);
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});

async function updateTableLabel(newId: string | number | null): Promise<void> {
    if (!selectedElement.value || !selectedElement.value || !newId) return;
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
    if (!props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", props.selectedFloorElement);
    }
}

function getElementWidth(e: BaseTable | null): number {
    return Math.round((e?.group?.width || 0) * (e?.group?.scaleX || 0));
}

function getElementHeight(e: BaseTable | null): number {
    return Math.round((e?.group?.height || 0) * (e?.group?.scaleY || 0));
}

function isSelectedElementRoundTable(
    selectedElement: BaseTable | null
): selectedElement is RoundTableElement {
    if (!selectedElement) {
        return false;
    }
    const element = selectedElement;
    return isRoundTable(element) && !!element.radius;
}
</script>
