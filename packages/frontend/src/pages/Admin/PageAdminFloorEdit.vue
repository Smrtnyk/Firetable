<script setup lang="ts">
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";

import { extractAllTablesLabels } from "@firetable/floor-creator";
import { useEventListener } from "@vueuse/core";
import { Loading } from "quasar";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { getFloorPath } from "src/db";
import { isTablet } from "src/global-reactives/screen-detection";
import { compressFloorDoc, decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { onMounted, useTemplateRef } from "vue";
import { useRouter } from "vue-router";

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
    pending: isFloorLoading,
    promise: floorDataPromise,
} = useFirestoreDocument<FloorDoc>(floorPath, { once: true });
const {
    floorInstance,
    hasChanges,
    initializeFloor,
    onDeleteElement,
    onFloorChange,
    resizeFloor,
    selectedElement,
} = useFloorEditor(pageRef);

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
    });
}

async function onFloorSave(): Promise<void> {
    if (!floorInstance.value) {
        return;
    }

    const { name } = floorInstance.value;
    const { height, json, width } = floorInstance.value.export();

    await tryCatchLoadingWrapper({
        async hook() {
            await updateFirestoreDocument(getFirestoreDocument(floorPath), {
                height,
                json: compressFloorDoc(json),
                name,
                width,
            });
            floorInstance.value?.markAsSaved();
        },
    });
}
</script>

<template>
    <div class="PageAdminFloorEdit floor-editor-page">
        <div :class="['grid-container', { 'is-tablet': isTablet }]">
            <div class="left-controls full-height" v-if="!isTablet">
                <FloorEditorControls
                    v-if="floorInstance"
                    :can-save="hasChanges"
                    :floor-instance="floorInstance"
                    @floor-save="onFloorSave"
                    @floor-update="onFloorChange"
                />
            </div>
            <div class="main-content" ref="pageRef">
                <q-card
                    class="top-controls full-width full-height content-center ft-card ft-no-border-radius q-px-xs"
                >
                    <FloorEditorTopControls
                        v-if="selectedElement && floorInstance && !isTablet"
                        :selected-floor-element="selectedElement"
                        :floor-instance="floorInstance"
                        :existing-labels="
                            new Set(extractAllTablesLabels(floorInstance as FloorEditor))
                        "
                        @delete="onDeleteElement"
                    />
                </q-card>
                <div class="floor-editor ft-card">
                    <canvas v-if="floor && !isFloorLoading" ref="canvasRef" />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.floor-editor-page {
    width: 100%;
    height: 100%;
}

.grid-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 100%;
    grid-template-areas: "left main";
    width: 100%;
    height: 100vh;
}

.left-controls {
    grid-area: left;
    overflow-y: auto;
    margin: auto auto auto 10px;
}

.main-content {
    grid-area: main;
    display: grid;
    grid-template-rows: 8% 94%;
    grid-template-areas:
        "top"
        "editor";
    width: calc(100vw - 270px);
    height: calc(100vh - 140px);
}

.top-controls {
    width: 90%;
    margin: auto;
    grid-area: top;
    overflow-y: auto;
}

.floor-editor {
    margin: auto;
    grid-area: editor;
    position: relative;
}

/*  for tablet and smaller screens */
.grid-container.is-tablet {
    grid-template-columns: 1fr; /* Only one column */
    grid-template-areas: "main"; /* Only main area */
}

.grid-container.is-tablet .main-content {
    grid-template-rows: 1fr; /* Only one row */
    grid-template-areas: "editor"; /* Only editor area */
    width: 100%;
    height: 100vh;
}

.grid-container.is-tablet .top-controls {
    display: none; /* Hide top-controls if present */
}

.grid-container.is-tablet .floor-editor {
    grid-area: editor;
    width: 100%;
    height: 100%;
}
</style>
