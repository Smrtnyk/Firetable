<script setup lang="ts">
import type { Floor, FloorEditorElement } from "@firetable/floor-creator";
import type { FloorDoc, NumberTuple } from "@firetable/types";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";

import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import {
    extractAllTablesLabels,
    FloorEditor,
    hasFloorTables,
    MAX_FLOOR_HEIGHT,
    MAX_FLOOR_WIDTH,
    RESOLUTION,
} from "@firetable/floor-creator";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isMobile, buttonSize, isTablet } from "src/global-reactives/screen-detection";
import { getFloorPath } from "@firetable/backend";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { useFloorEditor, TABLE_EL_TO_ADD } from "src/composables/useFloorEditor";
import { isTouchDevice } from "src/helpers/is-touch-device";

interface Props {
    floorId: string;
    organisationId: string;
    propertyId: string;
}
const addNewElementsBottomSheetOptions = {
    message: "Choose action",
    grid: true,
    actions: ELEMENTS_TO_ADD_COLLECTION,
};

const props = defineProps<Props>();
const router = useRouter();
const q = useQuasar();
const floorInstance = shallowRef<FloorEditor | undefined>();
const canvasRef = useTemplateRef<HTMLCanvasElement | undefined>("canvasRef");
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");
const selectedElement = ref<FloorEditorElement | undefined>();

const floorPath = getFloorPath(props.organisationId, props.propertyId, props.floorId);
const {
    data: floor,
    promise: floorDataPromise,
    pending: isFloorLoading,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });
const { getNextTableLabel, onFloorDrop, resizeFloor } = useFloorEditor(floorInstance, pageRef);

function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "s") {
        // Prevents browser's save dialog from showing
        event.preventDefault();
        onFloorSave();
    }
}

onBeforeUnmount(function () {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", resizeFloor);
});

onMounted(async function () {
    Loading.show();
    await floorDataPromise.value;
    if (floor.value) {
        instantiateFloor(floor.value);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", resizeFloor);
    } else {
        router.replace("/").catch(showErrorMessage);
    }
    Loading.hide();
});

function instantiateFloor(floorDoc: FloorDoc): void {
    if (!canvasRef.value || !pageRef.value) {
        return;
    }

    const floorEditor = new FloorEditor({
        canvas: canvasRef.value,
        floorDoc: decompressFloorDoc(floorDoc),
        containerWidth: pageRef.value.clientWidth,
    });
    floorInstance.value = floorEditor;

    floorEditor.on("elementClicked", elementClickHandler);
    floorEditor.on("doubleClick", dblClickHandler);
    floorEditor.on("drop", onFloorDrop);
}

async function onFloorSave(): Promise<void> {
    if (!floorInstance.value || !hasFloorTables(floorInstance.value as FloorEditor)) {
        return showErrorMessage("You need to add at least one table!");
    }

    const { name, width, height, json } = floorInstance.value;

    await tryCatchLoadingWrapper({
        async hook() {
            await updateFirestoreDocument(getFirestoreDocument(floorPath), {
                json: compressFloorDoc(json),
                name,
                width,
                height,
                compressed: true,
            });
        },
    });
}

function onFloorChange({
    name,
    width,
    height,
}: {
    width?: number;
    height?: number;
    name?: string;
}): void {
    if (name) {
        floorInstance.value?.setFloorName(String(name));
        return;
    }

    if (width && !Number.isNaN(width)) {
        floorInstance.value?.updateDimensions(width, floorInstance.value.height);
    }

    if (height && !Number.isNaN(height)) {
        floorInstance.value?.updateDimensions(floorInstance.value.width, Number(height));
    }
}

function handleAddNewElement(floorVal: FloorEditor, [x, y]: NumberTuple) {
    return function ({ tag }: (typeof ELEMENTS_TO_ADD_COLLECTION)[0]) {
        if (TABLE_EL_TO_ADD.includes(tag)) {
            floorVal.addElement({ x, y, tag, label: getNextTableLabel() });
            return;
        }
        floorVal.addElement({ x, y, tag });
    };
}

function dblClickHandler(floorVal: FloorEditor, coords: NumberTuple): void {
    if (!isTouchDevice) {
        return;
    }
    q.bottomSheet(addNewElementsBottomSheetOptions).onOk(handleAddNewElement(floorVal, coords));
}

async function elementClickHandler(
    _: Floor,
    element: FloorEditorElement | undefined,
): Promise<void> {
    selectedElement.value = undefined;
    await nextTick();
    selectedElement.value = element;
}

function onDeleteElement(element: FloorEditorElement): void {
    const elementToDelete = element.canvas?.getActiveObject();
    if (!elementToDelete) {
        return;
    }
    element.canvas?.remove(elementToDelete);
    selectedElement.value = undefined;
}
</script>

<template>
    <div class="PageAdminFloorEdit flex column justify-center" ref="pageRef">
        <div v-if="floorInstance" class="justify-between q-mb-sm">
            <q-input
                v-if="isTablet"
                standout
                rounded
                label="Floor name"
                @update:model-value="(event) => onFloorChange({ name: String(event) })"
                :model-value="floorInstance.name"
                :dense="isMobile"
            >
                <template #append>
                    <q-btn
                        class="button-gradient"
                        @click="onFloorSave"
                        label="save"
                        rounded
                        :size="buttonSize"
                    />
                </template>
            </q-input>
        </div>

        <FloorEditorControls
            v-if="floorInstance"
            @delete="onDeleteElement"
            :floor-instance="floorInstance"
            :selected-floor-element="selectedElement"
            :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
            @floor-save="onFloorSave"
            @floor-update="onFloorChange"
        >
            <template #buttons> </template>
        </FloorEditorControls>

        <div class="row q-pa-sm q-col-gutter-md" v-if="floorInstance">
            <div class="col-6" v-if="isTablet">
                <q-badge color="secondary">
                    Width: {{ floorInstance.width }} (300 to {{ MAX_FLOOR_WIDTH }})
                </q-badge>
                <q-slider
                    :model-value="floorInstance.width"
                    :min="300"
                    :max="MAX_FLOOR_WIDTH"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange({ width: event || 0 })"
                />
            </div>
            <div class="col-6" v-if="isTablet">
                <q-badge color="secondary">
                    Height: {{ floorInstance.height }} (300 to {{ MAX_FLOOR_HEIGHT }})
                </q-badge>
                <q-slider
                    :min="300"
                    :max="MAX_FLOOR_HEIGHT"
                    :step="RESOLUTION"
                    label
                    color="deep-orange"
                    @update:model-value="(event) => onFloorChange({ height: event || 0 })"
                    :model-value="floorInstance.height"
                />
            </div>
        </div>

        <div class="ft-card ft-border ft-no-border-radius">
            <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
        </div>
    </div>
</template>
