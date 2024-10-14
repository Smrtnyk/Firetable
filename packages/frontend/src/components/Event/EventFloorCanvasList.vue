<script setup lang="ts">
import type { FloorDoc } from "@firetable/types";

export interface EventFloorCanvasListProps {
    eventFloors: FloorDoc[];
    mapFloorToCanvas: (floor: FloorDoc) => (element: any) => void;
    isActiveFloor: (floorId: string) => boolean;
}

const { eventFloors, mapFloorToCanvas, isActiveFloor } = defineProps<EventFloorCanvasListProps>();
</script>

<template>
    <div class="EventFloorCanvasList">
        <div
            v-for="floor in eventFloors"
            :key="floor.id"
            class="ft-tab-pane"
            :class="{ 'active show': isActiveFloor(floor.id) }"
        >
            <div class="ft-card ft-border ft-no-border-radius">
                <canvas :id="floor.id" :ref="mapFloorToCanvas(floor)"></canvas>
            </div>
        </div>
    </div>
</template>
