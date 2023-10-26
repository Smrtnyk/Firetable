<template>
    <div class="row q-pa-sm q-col-gutter-md" v-if="selectedFloorElement">
        <div class="col-8 flex justify-between">
            <div class="row">
                <div class="col-4 q-pa-xs q-pl-none">
                    <q-input
                        :dense="isMobile"
                        :model-value="getElementWidth"
                        filled
                        label="Width"
                        readonly
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        :dense="isMobile"
                        :model-value="getElementHeight"
                        filled
                        label="Height"
                        readonly
                    />
                </div>
                <div class="col-4 q-pa-xs">
                    <q-input
                        :debounce="500"
                        v-if="isTable(selectedFloorElement)"
                        :model-value="selectedFloorElement.label"
                        @update:model-value="
                            (newLabel) =>
                                updateTableLabel(
                                    selectedFloorElement as BaseTable,
                                    newLabel as string,
                                )
                        "
                        type="text"
                        filled
                        label="Table label"
                        :dense="isMobile"
                    />
                </div>
            </div>
        </div>
        <div class="col-4 flex q-pl-none justify-end">
            <!-- Color Picker Button -->
            <q-btn
                v-if="elementColor"
                :style="{ 'background-color': elementColor }"
                @click="openColorPicker"
                :size="buttonSize"
            >
                <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                <q-popup-proxy
                    no-parent-event
                    ref="colorPickerProxy"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                >
                    <q-color :model-value="elementColor" @update:model-value="setElementColor" />
                </q-popup-proxy>
            </q-btn>

            <!-- Delete Button -->
            <q-btn
                v-if="selectedFloorElement && deleteAllowed"
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
import { computed, ref, watch, toRefs } from "vue";
import { BaseTable, FloorEditorElement, isTable } from "@firetable/floor-creator";
import { QPopupProxy, useQuasar } from "quasar";

interface Props {
    selectedFloorElement: FloorEditorElement | undefined;
    deleteAllowed?: boolean;
    existingLabels: Set<string>;
}

const q = useQuasar();
const isMobile = computed(() => q.screen.lt.sm);
const buttonSize = computed(() => (isMobile.value ? "xs" : "md"));
const colorPickerProxy = ref<QPopupProxy | null>(null);

const props = withDefaults(defineProps<Props>(), {
    deleteAllowed: true,
});
const { selectedFloorElement, deleteAllowed, existingLabels } = toRefs(props);
const emit = defineEmits(["delete"]);

const elementColor = ref<string>("");

watch(selectedFloorElement, (newEl) => {
    if (newEl?.getBaseFill) {
        elementColor.value = newEl.getBaseFill();
    }
});

function openColorPicker() {
    colorPickerProxy.value?.show();
}

function updateTableLabel(tableEl: BaseTable, newLabel: string): void {
    if (!newLabel) {
        return;
    }
    if (existingLabels.value.has(newLabel)) {
        showErrorMessage("Table Id already taken");
        return;
    }
    tableEl.setLabel(newLabel);
}

async function deleteElement() {
    if (!selectedFloorElement.value) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement.value);
    }
}

const getElementWidth = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.width! * el.scaleX!) : 0;
});

const getElementHeight = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.height! * el.scaleY!) : 0;
});

function setElementColor(newVal: any) {
    elementColor.value = newVal;
    selectedFloorElement.value?.setBaseFill?.(newVal);
}
</script>
