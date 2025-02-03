<template>
    <template v-if="props.floor">
        <div class="AdminEventFloorViewer floor-editor-page">
            <div :class="['grid-container', { 'is-tablet': isTablet }]">
                <div class="left-controls">
                    <FloorEditorControls
                        @floor-save="saveFloorState"
                        @floor-update="onFloorChange"
                        v-if="floorInstance && !isTablet"
                        :can-save="hasChanges"
                        :floor-instance="floorInstance"
                        class="q-mb-sm"
                    />
                </div>
                <div class="main-content" ref="viewerContainerRef">
                    <div class="top-controls" v-if="selectedElement && floorInstance">
                        <FloorEditorTopControls
                            v-if="floorInstance && selectedElement && !isTablet"
                            @delete="onDeleteElement"
                            :selected-floor-element="selectedElement"
                            :floor-instance="floorInstance"
                            :existing-labels="new Set(extractAllTablesLabels(floorInstance))"
                        />
                    </div>
                    <div class="floor-editor">
                        <canvas id="floor-container" ref="floorContainerRef" />
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";

import { extractAllTablesLabels } from "@firetable/floor-creator";
import { useEventListener } from "@vueuse/core";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { isTablet } from "src/global-reactives/screen-detection";
import { onMounted, useTemplateRef, watch } from "vue";

type Emits = (e: "save", value: FloorEditor) => void;

interface Props {
    eventId: string;
    floor: FloorDoc;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const floorContainerRef = useTemplateRef<HTMLCanvasElement>("floorContainerRef");
const viewerContainerRef = useTemplateRef<HTMLDivElement>("viewerContainerRef");
const {
    floorInstance,
    hasChanges,
    initializeFloor,
    onDeleteElement,
    onFloorChange,
    resizeFloor,
    selectedElement,
} = useFloorEditor(viewerContainerRef);

onMounted(function () {
    useEventListener("resize", resizeFloor);
});

function saveFloorState(): void {
    if (!floorInstance.value) {
        return;
    }
    emit("save", floorInstance.value);
}

watch(floorContainerRef, function () {
    if (!floorContainerRef.value || !viewerContainerRef.value) {
        return;
    }
    initializeFloor({
        canvasElement: floorContainerRef.value,
        floorDoc: props.floor,
    });
});
</script>
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
