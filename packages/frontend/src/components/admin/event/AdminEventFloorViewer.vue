<template>
    <div ref="viewerContainerRef">
        <q-btn
            class="button-gradient"
            icon="save"
            @click="saveFloorState"
            label="save"
            size="md"
            rounded
        />
        <ShowSelectedElement
            :selected-floor-element="selectedFloorElement"
            :delete-allowed="false"
        />
        <canvas id="floor-container" class="eventFloor" ref="floorContainerRef" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, shallowRef, watch } from "vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import { Floor, FloorEditor, FloorEditorElement, FloorMode } from "@firetable/floor-creator";
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
        elementClickHandler: onElementClick,
        mode: props.mode,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
});
</script>
