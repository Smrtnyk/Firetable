<script setup lang="ts">
import type { FloorEditorElement, FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";

import { onMounted, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { Loading } from "quasar";
import { extractAllTablesLabels, hasFloorTables } from "@firetable/floor-creator";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { isTablet } from "src/global-reactives/screen-detection";
import { getFloorPath } from "@firetable/backend";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { useEventListener } from "@vueuse/core";

interface Props {
    floorId: string;
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const canvasRef = useTemplateRef<HTMLCanvasElement | undefined>("canvasRef");
const pageRef = useTemplateRef<HTMLDivElement>("pageRef");

const floorPath = getFloorPath(props.organisationId, props.propertyId, props.floorId);
const {
    data: floor,
    promise: floorDataPromise,
    pending: isFloorLoading,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });
const { resizeFloor, initializeFloor, onFloorChange, selectedElement, floorInstance } =
    useFloorEditor(pageRef);

function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "s") {
        // Prevents browser's save dialog from showing
        event.preventDefault();
        onFloorSave();
    }
}

onMounted(async function () {
    Loading.show();
    await floorDataPromise.value;
    if (floor.value) {
        instantiateFloor(floor.value);
        useEventListener("resize", resizeFloor);
        useEventListener("keydown", onKeyDown);
    } else {
        router.replace("/").catch(showErrorMessage);
    }
    Loading.hide();
});

function instantiateFloor(floorDoc: FloorDoc): void {
    if (!canvasRef.value || !pageRef.value) {
        return;
    }

    initializeFloor({
        canvasElement: canvasRef.value,
        floorDoc: decompressFloorDoc(floorDoc),
        containerWidth: pageRef.value.clientWidth,
    });
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
