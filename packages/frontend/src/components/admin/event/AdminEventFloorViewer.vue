<template>
    <q-layout v-if="props.floor">
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <div
                    ref="viewerContainerRef"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3"
                >
                    <q-btn
                        class="button-gradient q-mb-sm"
                        @click="saveFloorState"
                        label="save"
                        size="md"
                        rounded
                    />
                    <FloorEditorControls
                        v-if="floorInstance"
                        :selected-floor-element="selectedFloorElement"
                        :delete-allowed="false"
                        :existing-labels="
                            new Set(extractAllTablesLabels(floorInstance as FloorEditor))
                        "
                        class="q-mb-sm"
                    />
                    <q-card>
                        <canvas id="floor-container" ref="floorContainerRef" />
                    </q-card>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import {
    extractAllTablesLabels,
    Floor,
    FloorEditor,
    FloorEditorElement,
    FloorMode,
} from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";

interface Props {
    floor: FloorDoc;
    mode: FloorMode;
    eventId: string;
}

const selectedFloorElement = ref<FloorEditorElement | undefined>();
const props = defineProps<Props>();
const emit = defineEmits(["update"]);
const floorContainerRef = ref<HTMLCanvasElement | null>(null);
const viewerContainerRef = ref<HTMLDivElement | null>(null);
const floorInstance = ref<FloorEditor | null>(null);

onBeforeUnmount(() => {
    floorInstance.value?.destroy();
});

function saveFloorState(): void {
    if (!floorInstance.value) return;
    emit("update", floorInstance.value);
}

async function onElementClick(
    floor: Floor,
    element: FloorEditorElement | undefined,
): Promise<void> {
    selectedFloorElement.value = undefined;
    await nextTick();
    selectedFloorElement.value = element;
}

watch(floorContainerRef, () => {
    if (!floorContainerRef.value || !viewerContainerRef.value) return;
    floorInstance.value = new FloorEditor({
        floorDoc: props.floor,
        canvas: floorContainerRef.value,
        mode: props.mode,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
    floorInstance.value.on("elementClicked", onElementClick);
});
</script>
