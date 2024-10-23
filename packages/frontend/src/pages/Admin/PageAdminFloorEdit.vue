<script setup lang="ts">
import type { Floor, FloorEditorElement } from "@firetable/floor-creator";
import type { FloorDoc, NumberTuple } from "@firetable/types";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";

import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { Loading, useQuasar } from "quasar";
import { ELEMENTS_TO_ADD_COLLECTION } from "src/config/floor";
import { extractAllTablesLabels, FloorEditor, hasFloorTables } from "@firetable/floor-creator";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isTablet } from "src/global-reactives/screen-detection";
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
const quasar = useQuasar();
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
    globalThis.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", resizeFloor);
});

onMounted(async function () {
    Loading.show();
    await floorDataPromise.value;
    if (floor.value) {
        instantiateFloor(floor.value);
        globalThis.addEventListener("keydown", onKeyDown);
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
    quasar
        .bottomSheet(addNewElementsBottomSheetOptions)
        .onOk(handleAddNewElement(floorVal, coords));
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
        <FloorEditorTopControls
            v-if="selectedElement && !isTablet && floorInstance"
            :selected-floor-element="selectedElement"
            :floor-instance="floorInstance"
            :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
            @delete="onDeleteElement"
        />

        <FloorEditorControls
            v-if="floorInstance && !isTablet"
            :floor-instance="floorInstance"
            @floor-save="onFloorSave"
            @floor-update="onFloorChange"
        />

        <div class="ft-card ft-border ft-no-border-radius">
            <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
        </div>
    </div>
</template>
