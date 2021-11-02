<template>
    <q-btn
        class="button-gradient"
        icon="save"
        @click="saveFloorState"
        label="save"
        size="md"
        rounded
    />
    <div id="floor-container" class="eventFloor" ref="floorContainerRef" />
</template>

<script setup lang="ts">
import { Floor } from "src/floor-manager/Floor";
import { FloorDoc, FloorMode } from "src/types/floor";
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { saveFloor } from "src/services/firebase/db-floors";
import { updateEventFloorData } from "src/services/firebase/db-events";

interface Props {
    floor: FloorDoc;
    mode: FloorMode;
    eventId: string;
}

const quasar = useQuasar();
const props = defineProps<Props>();
const floorContainerRef = ref<HTMLDivElement | null>(null);
const floorInstance = ref<Floor | null>(null);

function saveFloorState(): void {
    if (!floorInstance.value) return;
    tryCatchLoadingWrapper(() =>
        updateEventFloorData(floorInstance.value as Floor, props.eventId)
    ).catch(showErrorMessage);
}

watch(floorContainerRef, () => {
    if (!floorContainerRef.value) return;
    floorInstance.value = new Floor.Builder()
        .setFloorDocument(props.floor)
        .setMode(props.mode)
        .setContainer(floorContainerRef.value)
        .build();
});
</script>
