<script setup lang="ts">
import type { FloorEditor, FloorEditorElement, FloorElementTypes } from "@firetable/floor-creator";
import { MAX_FLOOR_HEIGHT, MAX_FLOOR_WIDTH, RESOLUTION } from "@firetable/floor-creator";
import { showConfirm } from "src/helpers/ui-helpers";
import { onMounted, reactive, useTemplateRef } from "vue";
import { exportFile } from "quasar";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { AppLogger } from "src/logger/FTLogger.js";

interface Props {
    floorInstance: FloorEditor;
}

interface EmitEvents {
    (e: "delete", element: FloorEditorElement): void;
    (e: "floorUpdate", value: { width?: number; height?: number; name?: string }): void;
    (e: "floorSave"): void;
}

const { floorInstance } = defineProps<Props>();
const emit = defineEmits<EmitEvents>();

const undoRedoState = reactive({
    canUndo: false,
    canRedo: false,
});

onMounted(function () {
    floorInstance.on("historyChange", function () {
        undoRedoState.canUndo = floorInstance.canUndo();
        undoRedoState.canRedo = floorInstance.canRedo();
    });
});

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
</script>

<template>
    <q-card
        class="FloorEditorControls row q-gutter-xs q-pa-xs q-pt-md q-pb-md justify-around ft-card"
    >
        <div class="row items-center justify-around">
            <q-btn
                class="button-gradient q-mb-md"
                icon="save"
                @click="onFloorSave"
                label="save"
                rounded
            />
            <input
                ref="fileInputRef"
                type="file"
                @change="onFileSelected"
                style="display: none"
                accept=".json"
            />

            <q-input
                standout
                rounded
                label="Floor name"
                @update:model-value="(event) => onFloorChange('name', event)"
                :model-value="floorInstance.name"
                class="q-ma-xs full-width"
            />

            <q-input
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

            <q-btn
                round
                title="Toggle grid"
                @click="floorInstance.toggleGridVisibility"
                icon="grid"
            />
            <q-btn
                round
                icon="download"
                title="Export floor plan"
                @click="exportFloor(floorInstance as FloorEditor)"
            />
            <q-btn round title="Import floor plan" icon="import" @click="triggerFileInput" />
        </div>
        <!-- Add Element -->
        <q-separator inset />

        <div class="row items-center justify-around">
            <div
                draggable="true"
                v-for="element in ELEMENTS_TO_ADD_COLLECTION"
                :key="element.tag"
                class="col-5 justify-even text-center q-my-sm ft-border q-py-sm"
                @dragstart="onDragStart($event, element.tag)"
            >
                <p>{{ element.label }}</p>

                <q-avatar square size="42px">
                    <img :src="element.img ?? ''" alt="Floor element" />
                </q-avatar>
            </div>
        </div>
    </q-card>
</template>

<style lang="scss">
.FloorEditorControls {
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
