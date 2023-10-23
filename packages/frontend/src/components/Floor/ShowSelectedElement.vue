<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="selectedElement">
        <div class="col-10 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        :dense="isMobile"
                        :model-value="getElementWidth()"
                        filled
                        label="Width"
                        readonly
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        :dense="isMobile"
                        :model-value="getElementHeight()"
                        filled
                        label="Height"
                        readonly
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        v-if="isTable(selectedElement)"
                        :model-value="selectedElement.label"
                        @update:model-value="updateTableLabel"
                        filled
                        label="Table Name"
                        :dense="isMobile"
                    />
                </div>
            </div>
        </div>
        <div class="col-2 flex q-pl-none justify-end">
            <q-btn
                v-if="selectedElement && props.deleteAllowed"
                icon="trash"
                color="negative"
                @click="deleteElement"
                :size="buttonSize"
            />
        </div>
    </div>
    <div class="row q-pa-sm" v-else>
        <div class="col q-pa-xs">
            <q-input
                :dense="isMobile"
                model-value="No element selected..."
                disable
                readonly
                filled
                autogrow
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, nextTick } from "vue";
import { FloorEditorElement, isTable } from "@firetable/floor-creator";
import { useQuasar } from "quasar";

const q = useQuasar();
const isMobile = computed(() => q.screen.lt.sm);
const buttonSize = computed(() => (isMobile.value ? "xs" : "md"));

interface Props {
    selectedFloorElement: FloorEditorElement | undefined;
    deleteAllowed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    deleteAllowed: true,
});
const emit = defineEmits(["delete"]);
const selectedElement = computed(() => {
    return props.selectedFloorElement;
});

async function updateTableLabel(newId: string | number | null): Promise<void> {
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
    if (!props.selectedFloorElement) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", props.selectedFloorElement);
    }
}

function getElementWidth(): number {
    const el = selectedElement.value!;
    return Math.round(el.width! * el.scaleX!);
}

function getElementHeight(): number {
    const el = selectedElement.value!;
    return Math.round(el.height! * el.scaleY!);
}
</script>
