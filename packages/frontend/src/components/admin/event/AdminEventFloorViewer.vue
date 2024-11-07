<template>
    <q-layout v-if="props.floor">
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <div
                    ref="viewerContainerRef"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3 justify-center column"
                >
                    <FloorEditorTopControls
                        v-if="floorInstance && selectedElement && !isTablet"
                        :selected-floor-element="selectedElement"
                        :floor-instance="floorInstance"
                        :existing-labels="
                            new Set(extractAllTablesLabels(floorInstance as FloorEditor))
                        "
                    />
                    <FloorEditorControls
                        @floor-save="saveFloorState"
                        @floor-update="onFloorChange"
                        v-if="floorInstance && !isTablet"
                        :floor-instance="floorInstance"
                        class="q-mb-sm"
                    />
                    <div class="ft-card ft-border ft-no-border-radius">
                        <canvas id="floor-container" ref="floorContainerRef" />
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import { extractAllTablesLabels } from "@firetable/floor-creator";
import { onMounted, watch, useTemplateRef } from "vue";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { isTablet } from "src/global-reactives/screen-detection";

import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";
import { useEventListener } from "@vueuse/core";

interface Props {
    floor: FloorDoc;
    eventId: string;
}

type Emits = (e: "save", value: FloorEditor) => void;

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const floorContainerRef = useTemplateRef<HTMLCanvasElement>("floorContainerRef");
const viewerContainerRef = useTemplateRef<HTMLDivElement>("viewerContainerRef");
const { resizeFloor, initializeFloor, onFloorChange, floorInstance, selectedElement } =
    useFloorEditor(viewerContainerRef);

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
        floorDoc: props.floor,
        canvasElement: floorContainerRef.value,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
});
</script>
