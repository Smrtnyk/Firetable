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
        <ShowSelectedElement :selected-floor-element="selectedFloorElement" />
        <canvas id="floor-container" class="eventFloor" ref="floorContainerRef" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";
import { BaseTable, Floor, FloorMode } from "@firetable/floor-creator";
import { FloorDoc } from "@firetable/types";

interface Props {
    floor: FloorDoc;
    mode: FloorMode;
    eventId: string;
}

const selectedFloorElement = ref<null | BaseTable>(null);
const props = defineProps<Props>();
const emit = defineEmits(["update"]);
const floorContainerRef = ref<HTMLCanvasElement | null>(null);
const viewerContainerRef = ref<HTMLDivElement | null>(null);
const floorInstance = ref<Floor | null>(null);

function saveFloorState(): void {
    if (!floorInstance.value) return;
    emit("update", floorInstance.value);
}

async function onElementClick(floor: Floor, element: null | BaseTable): Promise<void> {
    selectedFloorElement.value = null;
    await nextTick();
    selectedFloorElement.value = element;
}

watch(floorContainerRef, () => {
    if (!floorContainerRef.value || !viewerContainerRef.value) return;
    floorInstance.value = new Floor({
        floorDoc: props.floor,
        canvas: floorContainerRef.value,
        elementClickHandler: onElementClick,
        mode: props.mode,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
});
</script>
