<template>
    <div ref="viewerContainerRef" v-if="props.floor">
        <q-btn
            class="button-gradient q-mb-sm"
            @click="saveFloorState"
            label="save"
            size="md"
            rounded
        />
        <ShowSelectedElement
            v-if="floorInstance"
            :selected-floor-element="selectedFloorElement"
            :delete-allowed="false"
            :existing-labels="new Set(extractAllTablesLabels(floorInstance as FloorEditor))"
            class="q-mb-sm"
        />
        <q-card>
            <canvas id="floor-container" ref="floorContainerRef" />
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, shallowRef, watch } from "vue";
import ShowSelectedElement from "src/components/Floor/ShowSelectedElement.vue";
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
const floorInstance = shallowRef<FloorEditor | null>(null);

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
