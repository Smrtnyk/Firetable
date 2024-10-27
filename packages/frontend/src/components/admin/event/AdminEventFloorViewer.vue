<template>
    <q-layout v-if="props.floor">
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <div
                    ref="viewerContainerRef"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3 justify-center column"
                >
                    <FloorEditorTopControls
                        v-if="floorInstance && selectedFloorElement && !isTablet"
                        :selected-floor-element="selectedFloorElement"
                        :floor-instance="floorInstance"
                        :existing-labels="
                            new Set(extractAllTablesLabels(floorInstance as FloorEditor))
                        "
                    />
                    <FloorEditorControls
                        @floor-save="saveFloorState"
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
import type { Floor, FloorEditorElement } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import { extractAllTablesLabels, FloorEditor } from "@firetable/floor-creator";
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, useTemplateRef } from "vue";
import { useFloorEditor } from "src/composables/useFloorEditor";
import { AppLogger } from "src/logger/FTLogger.js";
import { isTablet } from "src/global-reactives/screen-detection";

import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import FloorEditorTopControls from "src/components/Floor/FloorEditorTopControls.vue";
import { useEventListener } from "@vueuse/core";

interface Props {
    floor: FloorDoc;
    eventId: string;
}

const selectedFloorElement = ref<FloorEditorElement | undefined>();
const props = defineProps<Props>();
const emit = defineEmits(["update"]);
const floorContainerRef = useTemplateRef<HTMLCanvasElement>("floorContainerRef");
const viewerContainerRef = useTemplateRef<HTMLDivElement>("viewerContainerRef");
const floorInstance = shallowRef<FloorEditor | undefined>();
const { onFloorDrop, resizeFloor } = useFloorEditor(floorInstance, viewerContainerRef);

onMounted(function () {
    useEventListener("resize", resizeFloor);
});

onBeforeUnmount(function () {
    floorInstance.value?.destroy().catch(AppLogger.error.bind(AppLogger));
});

function saveFloorState(): void {
    if (!floorInstance.value) {
        return;
    }
    emit("update", floorInstance.value);
}

async function onElementClick(
    _floor: Floor,
    element: FloorEditorElement | undefined,
): Promise<void> {
    selectedFloorElement.value = undefined;
    await nextTick();
    selectedFloorElement.value = element;
}

watch(floorContainerRef, function () {
    if (!floorContainerRef.value || !viewerContainerRef.value) {
        return;
    }

    floorInstance.value = new FloorEditor({
        floorDoc: props.floor,
        canvas: floorContainerRef.value,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
    floorInstance.value.on("drop", onFloorDrop);
    floorInstance.value.on("elementClicked", onElementClick);
});
</script>
