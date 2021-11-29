<!--<template>-->
<!--    <q-btn-->
<!--        class="button-gradient"-->
<!--        icon="save"-->
<!--        @click="saveFloorState"-->
<!--        label="save"-->
<!--        size="md"-->
<!--        rounded-->
<!--    />-->
<!--    <ShowSelectedElement-->
<!--        :selected-floor-element="selectedFloorElement"-->
<!--        :selected-floor="selectedFloor"-->
<!--    />-->
<!--    <div id="floor-container" class="eventFloor" ref="floorContainerRef" />-->
<!--</template>-->

<!--<script setup lang="ts">-->
<!--import { BaseFloorElement, FloorDoc, FloorMode } from "src/types/floor";-->
<!--import { ref, watch } from "vue";-->
<!--import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";-->
<!--import { updateEventFloorData } from "src/services/firebase/db-events";-->
<!--import ShowSelectedElement from "components/Floor/ShowSelectedElement.vue";-->

<!--interface Props {-->
<!--    floor: FloorDoc;-->
<!--    mode: FloorMode;-->
<!--    eventId: string;-->
<!--}-->

<!--const selectedFloorElement = ref<null | BaseFloorElement>(null);-->
<!--const selectedFloor = ref<null | Floor>(null);-->
<!--const props = defineProps<Props>();-->
<!--const floorContainerRef = ref<HTMLDivElement | null>(null);-->
<!--const floorInstance = ref<Floor | null>(null);-->

<!--function saveFloorState(): void {-->
<!--    if (!floorInstance.value) return;-->
<!--    tryCatchLoadingWrapper(() =>-->
<!--        updateEventFloorData(floorInstance.value as Floor, props.eventId)-->
<!--    ).catch(showErrorMessage);-->
<!--}-->

<!--function onElementClick(floor: null | Floor, element: null | BaseFloorElement): void {-->
<!--    selectedFloor.value = floor;-->
<!--    selectedFloorElement.value = element;-->
<!--}-->

<!--watch(floorContainerRef, () => {-->
<!--    if (!floorContainerRef.value) return;-->
<!--    floorInstance.value = new Floor.Builder()-->
<!--        .setFloorDocument(props.floor)-->
<!--        .setMode(props.mode)-->
<!--        .setContainer(floorContainerRef.value)-->
<!--        .setElementClickHander(onElementClick)-->
<!--        .build();-->
<!--});-->
<!--</script>-->
