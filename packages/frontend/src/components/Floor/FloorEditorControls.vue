<script setup lang="ts">
import type {
    BaseTable,
    FloorEditor,
    FloorEditorElement,
    FloorElementTypes,
} from "@firetable/floor-creator";
import { MAX_FLOOR_HEIGHT, MAX_FLOOR_WIDTH, RESOLUTION, isTable } from "@firetable/floor-creator";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from "vue";
import { exportFile, QPopupProxy } from "quasar";
import { buttonSize, isMobile, isTablet } from "src/global-reactives/screen-detection";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";

interface Props {
    selectedFloorElement: FloorEditorElement | undefined;
    floorInstance: FloorEditor;
    deleteAllowed?: boolean;
    existingLabels: Set<string>;
}

interface EmitEvents {
    (e: "delete", element: FloorEditorElement): void;
    (e: "floorUpdate", value: { width?: number; height?: number; name?: string }): void;
    (e: "floorSave"): void;
}

const props = withDefaults(defineProps<Props>(), {
    deleteAllowed: true,
});
const { selectedFloorElement, deleteAllowed, existingLabels } = toRefs(props);
const emit = defineEmits<EmitEvents>();
const colorPickerProxy = ref<QPopupProxy | null>(null);
const getElementWidth = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.width * el.scaleX) : 0;
});
const undoRedoState = reactive({
    canUndo: false,
    canRedo: false,
});
const getElementHeight = computed(() => {
    const el = selectedFloorElement.value;
    return el ? Math.round(el.height * el.scaleY) : 0;
});

const localWidth = ref(getElementWidth.value);
const localHeight = ref(getElementHeight.value);
const elementColor = ref("");

function onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === "Delete" && selectedFloorElement.value) {
        deleteElement();
    }
}

onMounted(() => {
    props.floorInstance.on("commandChange", () => {
        undoRedoState.canUndo = props.floorInstance.canUndo();
        undoRedoState.canRedo = props.floorInstance.canRedo();
    });
    document.addEventListener("keydown", onKeyDownListener);
});

onBeforeUnmount(() => {
    document.removeEventListener("keydown", onKeyDownListener);
});

watch(selectedFloorElement, (newEl) => {
    localWidth.value = newEl ? Math.round(newEl.width * newEl.scaleX) : 0;
    localHeight.value = newEl ? Math.round(newEl.height * newEl.scaleY) : 0;

    if (newEl?.getBaseFill) {
        elementColor.value = newEl.getBaseFill();
    }
});

watch(localWidth, (newWidth) => {
    if (!selectedFloorElement.value) {
        return;
    }
    selectedFloorElement.value.scaleX = newWidth / selectedFloorElement.value.width;
    selectedFloorElement.value.setCoords();
    selectedFloorElement.value.canvas?.renderAll();
});

watch(localHeight, (newHeight) => {
    if (!selectedFloorElement.value) {
        return;
    }
    selectedFloorElement.value.scaleY = newHeight / selectedFloorElement.value.height;
    selectedFloorElement.value.setCoords();
    selectedFloorElement.value.canvas?.renderAll();
});

watch(selectedFloorElement, (newEl) => {
    if (newEl?.getBaseFill) {
        elementColor.value = newEl.getBaseFill();
    }
});

function openColorPicker(): void {
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

async function deleteElement(): Promise<void> {
    if (!selectedFloorElement.value) return;
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement.value);
    }
}

function setElementColor(newVal: any): void {
    elementColor.value = newVal;
    selectedFloorElement.value?.setBaseFill?.(newVal);
}

async function exportFloor(floorVal: FloorEditor): Promise<void> {
    if (!(await showConfirm("Do you want to export this floor plan?"))) {
        return;
    }
    exportFile(
        `${floorVal.name}.json`,
        JSON.stringify({
            json: floorVal.json,
            width: floorVal.width,
            height: floorVal.height,
        }),
    );
}

function undoAction(): void {
    if (!props.floorInstance) {
        return;
    }
    props.floorInstance.undo();
    props.floorInstance.canvas.renderAll();
}

function redoAction(): void {
    if (!props.floorInstance) {
        return;
    }
    props.floorInstance.redo();
    props.floorInstance.canvas.renderAll();
}
const fileInputRef = ref<HTMLInputElement | null>(null);

function onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (props.floorInstance) {
                props.floorInstance.importFloor(jsonData);
            }
        };
        reader.readAsText(file);
    }
}

function triggerFileInput(): void {
    fileInputRef.value?.click();
}

function onDragStart(event: DragEvent, item: FloorElementTypes): void {
    event.dataTransfer?.setData(
        "text/plain",
        JSON.stringify({
            item,
            type: "floor-element",
        }),
    );
}

function onFloorChange(prop: keyof FloorEditor, event: null | number | string): void {
    emit("floorUpdate", { [prop]: event });
}

function onFloorSave(): void {
    emit("floorSave");
}
</script>

<template>
    <div v-if="!isTablet" class="ShowSelectedElement">
        <q-card
            class="ShowSelectedElement__floating-controls row q-gutter-xs q-ma-xs q-pa-xs q-pt-md q-pb-md justify-around items-center"
        >
            <q-btn
                v-if="!isTablet"
                class="button-gradient q-mb-md"
                icon="save"
                @click="onFloorSave"
                label="save"
                rounded
                :size="buttonSize"
            />
            <q-input
                v-if="!isTablet"
                standout
                rounded
                label="Floor name"
                @update:model-value="(event) => onFloorChange('name', event)"
                :model-value="floorInstance.name"
                :dense="isMobile"
                class="q-ma-xs"
            />

            <q-input
                v-if="!isTablet"
                @keydown.prevent
                :min="300"
                :max="MAX_FLOOR_WIDTH"
                :step="RESOLUTION"
                :model-value="floorInstance.width"
                @update:model-value="(event) => onFloorChange('width', event)"
                standout
                rounded
                type="number"
                label="Floor width"
                class="q-ma-xs"
            />
            <q-input
                v-if="!isTablet"
                @keydown.prevent
                :min="300"
                :max="MAX_FLOOR_HEIGHT"
                :step="RESOLUTION"
                @update:model-value="(event) => onFloorChange('height', event)"
                :model-value="floorInstance.height"
                standout
                rounded
                type="number"
                label="Floor height"
                class="q-ma-xs"
            />
            <q-btn
                title="Undo"
                round
                :disabled="!undoRedoState.canUndo"
                @click="undoAction"
                icon="undo"
            />
            <q-btn
                title="Redo"
                round
                :disabled="!undoRedoState.canRedo"
                @click="redoAction"
                icon="redo"
            />
            <!-- Add Element -->
            <q-btn round title="Add element" icon="plus">
                <q-menu max-width="200px">
                    <div class="row items-center">
                        <div
                            draggable="true"
                            v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                            :key="element.elementDescriptor.tag"
                            class="col-6 justify-center text-center q-my-md"
                            @dragstart="onDragStart($event, element.elementDescriptor.tag)"
                        >
                            <p>{{ element.label }}</p>

                            <q-avatar square size="42px">
                                <img :src="element.img" />
                            </q-avatar>
                        </div>
                    </div>
                </q-menu>
            </q-btn>

            <q-btn
                round
                title="Toggle grid"
                @click="floorInstance.toggleGridVisibility"
                icon="grid"
            />
            <q-btn
                round
                icon="export"
                title="Export floor plan"
                @click="exportFloor(floorInstance as FloorEditor)"
            />
            <q-btn round title="Import floor plan" icon="import" @click="triggerFileInput" />
            <input
                ref="fileInputRef"
                type="file"
                @change="onFileSelected"
                style="display: none"
                accept=".json"
            />
            <div class="row justify-around q-gutter-xs" v-if="selectedFloorElement">
                <q-separator inset class="q-ma-md full-width"></q-separator>
                <p>Element</p>
                <q-input
                    v-model.number="localWidth"
                    standout
                    rounded
                    type="number"
                    label="Width"
                    class="q-ma-xs"
                />
                <q-input
                    rounded
                    v-model.number="localHeight"
                    standout
                    type="number"
                    label="Height"
                    class="q-ma-xs"
                />
                <q-input
                    v-if="isTable(selectedFloorElement)"
                    class="q-ma-xs"
                    :debounce="500"
                    :model-value="selectedFloorElement.label"
                    @update:model-value="
                        (newLabel) =>
                            updateTableLabel(selectedFloorElement as BaseTable, newLabel as string)
                    "
                    type="text"
                    standout
                    rounded
                    label="Table label"
                />
                <q-btn
                    title="Change element fill color"
                    v-if="elementColor"
                    :style="{ 'background-color': elementColor }"
                    @click="openColorPicker"
                    round
                >
                    <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                    <q-popup-proxy
                        no-parent-event
                        ref="colorPickerProxy"
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                    >
                        <q-color
                            :model-value="elementColor"
                            @update:model-value="setElementColor"
                        />
                    </q-popup-proxy>
                </q-btn>
                <q-btn
                    title="Delete element"
                    v-if="deleteAllowed"
                    round
                    icon="trash"
                    color="negative"
                    @click="deleteElement"
                />
            </div>
        </q-card>
    </div>
    <div v-else>
        <div v-if="selectedFloorElement && isTablet" class="row">
            <div class="col-md-6 col-12 row q-gutter-xs">
                <div class="col">
                    <q-input
                        :dense="isMobile"
                        v-model.number="localWidth"
                        standout
                        rounded
                        type="number"
                        label="Width"
                    />
                </div>
                <div class="col">
                    <q-input
                        rounded
                        :dense="isMobile"
                        v-model.number="localHeight"
                        standout
                        type="number"
                        label="Height"
                    />
                </div>
                <div class="col" v-if="isTable(selectedFloorElement)">
                    <q-input
                        :debounce="500"
                        :model-value="selectedFloorElement.label"
                        @update:model-value="
                            (newLabel) =>
                                updateTableLabel(
                                    selectedFloorElement as BaseTable,
                                    newLabel as string,
                                )
                        "
                        type="text"
                        standout
                        rounded
                        label="Table label"
                        :dense="isMobile"
                    />
                </div>
            </div>

            <div class="col-md-6 col-12 row justify-md-end q-mt-sm q-mt-md-none">
                <!-- Color Picker Button -->
                <q-btn
                    title="Change element fill color"
                    v-if="elementColor"
                    :style="{ 'background-color': elementColor }"
                    @click="openColorPicker"
                >
                    <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                    <q-popup-proxy
                        no-parent-event
                        ref="colorPickerProxy"
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                    >
                        <q-color
                            :model-value="elementColor"
                            @update:model-value="setElementColor"
                        />
                    </q-popup-proxy>
                </q-btn>

                <!-- Delete Button -->
                <q-btn
                    title="Delete element"
                    v-if="deleteAllowed"
                    icon="trash"
                    color="negative"
                    @click="deleteElement"
                />
                <slot name="buttons"></slot>
            </div>
        </div>

        <div v-else class="row">
            <div class="col-md-6 col-12">
                <q-input
                    :dense="isMobile"
                    model-value="No element selected..."
                    disable
                    readonly
                    standout
                    rounded
                    autogrow
                />
            </div>
            <div class="col-md-6 col-12 row justify-md-end q-mt-sm q-mt-md-none">
                <slot name="buttons"></slot>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.ShowSelectedElement {
    &__floating-controls {
        max-width: 140px;
        position: absolute;
        left: 0;
        top: 10%;
    }
}
</style>
