<script setup lang="ts">
import type {
    BaseTable,
    FloorEditor,
    FloorEditorElement,
    FloorElementTypes,
} from "@firetable/floor-creator";
import { MAX_FLOOR_HEIGHT, MAX_FLOOR_WIDTH, RESOLUTION, isTable } from "@firetable/floor-creator";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, useTemplateRef } from "vue";
import { exportFile, QPopupProxy } from "quasar";
import { buttonSize, isMobile, isTablet } from "src/global-reactives/screen-detection";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { AppLogger } from "src/logger/FTLogger.js";

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

const {
    deleteAllowed = true,
    existingLabels,
    selectedFloorElement,
    floorInstance,
} = defineProps<Props>();
const emit = defineEmits<EmitEvents>();
const colorPickerProxy = useTemplateRef<QPopupProxy>("colorPickerProxy");
const getElementWidth = computed(function () {
    return selectedFloorElement
        ? Math.round(selectedFloorElement.width * selectedFloorElement.scaleX)
        : 0;
});
const getElementHeight = computed(function () {
    return selectedFloorElement
        ? Math.round(selectedFloorElement.height * selectedFloorElement.scaleY)
        : 0;
});
const undoRedoState = reactive({
    canUndo: false,
    canRedo: false,
});

const localWidth = ref(getElementWidth.value);
const localHeight = ref(getElementHeight.value);
const elementColor = ref("");

function onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === "Delete" && selectedFloorElement) {
        deleteElement();
    }
}

onMounted(function () {
    floorInstance.on("commandChange", function () {
        undoRedoState.canUndo = floorInstance.canUndo();
        undoRedoState.canRedo = floorInstance.canRedo();
    });
    document.addEventListener("keydown", onKeyDownListener);
});

onBeforeUnmount(function () {
    document.removeEventListener("keydown", onKeyDownListener);
});

watch(
    () => selectedFloorElement,
    function (newEl) {
        localWidth.value = newEl ? Math.round(newEl.width * newEl.scaleX) : 0;
        localHeight.value = newEl ? Math.round(newEl.height * newEl.scaleY) : 0;

        if (newEl?.getBaseFill) {
            elementColor.value = newEl.getBaseFill();
        }
    },
);

watch(localWidth, function (newWidth) {
    if (!selectedFloorElement) {
        return;
    }
    selectedFloorElement.scaleX = newWidth / selectedFloorElement.width;
    selectedFloorElement.setCoords();
    selectedFloorElement.canvas?.renderAll();
});

watch(localHeight, function (newHeight) {
    if (!selectedFloorElement) {
        return;
    }
    selectedFloorElement.scaleY = newHeight / selectedFloorElement.height;
    selectedFloorElement.setCoords();
    selectedFloorElement.canvas?.renderAll();
});

watch(
    () => selectedFloorElement,
    function (newEl) {
        if (newEl?.getBaseFill) {
            elementColor.value = newEl.getBaseFill();
        }
    },
);

function openColorPicker(): void {
    colorPickerProxy.value?.show();
}

function updateTableLabel(
    tableEl: FloorEditorElement | undefined,
    newLabel: number | string | null,
): void {
    if (typeof newLabel !== "string" || !isTable(tableEl)) {
        return;
    }
    if (existingLabels.has(newLabel)) {
        showErrorMessage("Table Id already taken");
        return;
    }
    tableEl.setLabel(newLabel);
}

async function deleteElement(): Promise<void> {
    if (!selectedFloorElement) {
        return;
    }
    if (await showConfirm("Do you really want to delete this element?")) {
        emit("delete", selectedFloorElement);
    }
}

function setElementColor(newVal: any): void {
    elementColor.value = newVal;
    selectedFloorElement?.setBaseFill?.(newVal);
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
    if (!floorInstance) {
        return;
    }
    floorInstance.undo();
    floorInstance.canvas.renderAll();
}

function redoAction(): void {
    if (!floorInstance) {
        return;
    }
    floorInstance.redo();
    floorInstance.canvas.renderAll();
}
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInputRef");

function onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", function () {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (floorInstance) {
                floorInstance.importFloor(jsonData).catch(AppLogger.error.bind(AppLogger));
            }
        });
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

function onFloorChange(prop: keyof FloorEditor, event: number | string | null): void {
    emit("floorUpdate", { [prop]: event });
}

function onFloorSave(): void {
    emit("floorSave");
}

function sendBack(): void {
    selectedFloorElement?.canvas?.sendObjectBackwards(selectedFloorElement);
}
</script>

<template>
    <q-card
        v-if="!isTablet"
        class="FloorEditorControls row q-gutter-xs q-pa-xs q-pt-md q-pb-md justify-around items-center ft-card"
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
            class="q-ma-xs full-width"
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
            class="q-ma-xs full-width"
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
            class="q-ma-xs full-width"
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
                        :key="element.tag"
                        class="col-6 justify-center text-center q-my-md"
                        @dragstart="onDragStart($event, element.tag)"
                    >
                        <p>{{ element.label }}</p>

                        <q-avatar square size="42px">
                            <img :src="element.img ?? ''" alt="Floor element" />
                        </q-avatar>
                    </div>
                </div>
            </q-menu>
        </q-btn>

        <q-btn round title="Toggle grid" @click="floorInstance.toggleGridVisibility" icon="grid" />
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

        <div class="row justify-evenly" v-if="selectedFloorElement">
            <q-separator inset class="q-ma-md full-width"></q-separator>
            <p>Element</p>

            <q-input
                v-model.number="localWidth"
                standout
                rounded
                type="number"
                label="Width"
                class="q-ma-xs full-width"
            />
            <q-input
                rounded
                v-model.number="localHeight"
                standout
                type="number"
                label="Height"
                class="q-ma-xs full-width"
            />
            <q-input
                v-if="isTable(selectedFloorElement)"
                class="q-ma-xs full-width q-mb-md"
                :debounce="500"
                :model-value="selectedFloorElement.label"
                @update:model-value="(newLabel) => updateTableLabel(selectedFloorElement, newLabel)"
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
                    <q-color :model-value="elementColor" @update:model-value="setElementColor" />
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
            <q-btn
                title="Send back"
                v-if="deleteAllowed"
                round
                icon="send-backward"
                @click="sendBack"
            />
        </div>
    </q-card>

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
.FloorEditorControls {
    max-width: 15%;
    position: absolute;
    left: 0.5%;
    top: 10%;

    .element-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        grid-template-areas:
            "full1"
            "full2"
            "full3"
            "buttons";
        gap: 2%;
    }

    .full1 {
        grid-area: full1;
    }

    .full2 {
        grid-area: full2;
    }

    .full3 {
        grid-area: full3;
    }

    .buttons {
        grid-area: buttons;
        justify-self: center;
        align-self: center;
        text-align: center;
    }
}
</style>
