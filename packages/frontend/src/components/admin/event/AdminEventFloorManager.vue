<script setup lang="ts">
import type { EventFloorDoc, FloorDoc, ReservationDoc } from "@firetable/types";
import type { SortableEvent } from "vue-draggable-plus";

import { property } from "es-toolkit/compat";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { computed } from "vue";
import { vDraggable } from "vue-draggable-plus";

export interface AdminEventFloorManagerProps {
    animationDuration?: number;
    /** Floors that can be added (for edit mode) */
    availableFloors?: FloorDoc[];
    /** List of current floors */
    floors: EventFloorDoc[];
    /** Maximum number of floors allowed */
    maxFloors: number;
    /** Used to check if floor can be deleted */
    reservations?: ReservationDoc[];

    showEditButton?: boolean;
}

interface Emits {
    (event: "add" | "edit", floor: EventFloorDoc): void;
    (event: "remove", index: number): void;
    (event: "reorder", floors: EventFloorDoc[]): void;
}

const props = defineProps<AdminEventFloorManagerProps>();
const emit = defineEmits<Emits>();
const { buttonSize } = useScreenDetection();
const draggableFloors = computed(() => props.floors);

const draggableOptions = computed(() => ({
    animation: props.animationDuration ?? 150,
    // Specify the class of the items that can be dragged
    draggable: ".drag-item",
    // Specify the class of the handle within the item
    handle: ".drag-handle",
    // The onEnd function will be called by the directive
    onEnd: onDrop,
}));

const floorsWithReservations = computed(function () {
    if (!props.reservations) {
        return new Set<string>();
    }

    return new Set(props.reservations.map(property("floorId")));
});

function canDeleteFloor(floorId: string): boolean {
    return !floorsWithReservations.value.has(floorId);
}

const remainingFloors = computed(function () {
    if (props.maxFloors === undefined) {
        return Infinity;
    }
    return props.maxFloors - props.floors.length;
});

function onAddFloor(floor: EventFloorDoc): void {
    if (remainingFloors.value <= 0) {
        return;
    }
    emit("add", {
        ...floor,
        id: floor.id,
        order: props.floors.length,
    });
}

function onDrop(event: SortableEvent): void {
    const { newDraggableIndex, oldDraggableIndex } = event;
    if (
        oldDraggableIndex === newDraggableIndex ||
        oldDraggableIndex === undefined ||
        newDraggableIndex === undefined
    ) {
        return;
    }

    // Create a new array from the proxy to manipulate
    const newFloors = [...draggableFloors.value];
    const [movedItem] = newFloors.splice(oldDraggableIndex, 1);
    newFloors.splice(newDraggableIndex, 0, movedItem);

    const reorderedFloors = newFloors.map(function (floor, index) {
        return {
            ...floor,
            order: index,
        };
    });

    emit("reorder", reorderedFloors);
}

function onEditFloor(floor: EventFloorDoc): void {
    emit("edit", floor);
}

function onRemoveFloor(index: number): void {
    emit("remove", index);
}
</script>

<template>
    <div class="event-floor-manager ma-0">
        <div v-if="availableFloors?.length" class="d-flex align-center justify-space-between mb-4">
            <div>
                <div class="text-h6">Floor plans</div>
                <div v-if="maxFloors !== undefined" class="text-caption text-grey-darken-1">
                    {{ floors.length }}/{{ maxFloors }} floors used
                </div>
            </div>
            <v-menu>
                <template #activator="{ props: menuActivatorProps }">
                    <v-tooltip location="top">
                        <template #activator="{ props: tooltipActivatorProps }">
                            <v-btn
                                v-bind="{ ...menuActivatorProps, ...tooltipActivatorProps }"
                                variant="tonal"
                                :rounded="true"
                                :size="buttonSize"
                                color="primary"
                                icon="fa fa-plus"
                                class="button-gradient"
                                aria-label="Add floor plan"
                                :disabled="remainingFloors <= 0"
                            />
                        </template>
                        <span v-if="remainingFloors <= 0"
                            >Maximum number of floors ({{ maxFloors }}) reached</span
                        >
                        <span v-else>Add floor</span>
                    </v-tooltip>
                </template>
                <v-list class="ft-card">
                    <v-list-item
                        v-for="floor in availableFloors"
                        :key="floor.id"
                        link
                        @click="onAddFloor(floor)"
                        :aria-label="`Add ${floor.name} floor plan`"
                    >
                        <v-list-item-title>{{ floor.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <div
            v-if="floors.length > 0"
            v-draggable="[draggableFloors, draggableOptions]"
            class="d-flex flex-column"
            style="gap: 8px"
        >
            <div
                v-for="(floor, index) in draggableFloors"
                :key="`${floor.id}-${index}`"
                class="drag-item"
            >
                <v-card variant="outlined" class="ft-card">
                    <v-list-item>
                        <template #prepend>
                            <v-icon
                                icon="fa fa-bars"
                                class="drag-handle cursor-move mr-2"
                                :aria-label="`${floor.id} draggable floor plan item drag handle`"
                            ></v-icon>
                        </template>

                        <v-list-item-title>{{ floor.name }}</v-list-item-title>
                        <v-list-item-subtitle v-if="!canDeleteFloor(floor.id)">
                            Has active reservations
                        </v-list-item-subtitle>

                        <template #append>
                            <div class="d-flex align-center">
                                <v-btn
                                    v-if="showEditButton"
                                    variant="text"
                                    icon="fa fa-pencil"
                                    color="primary"
                                    size="small"
                                    @click="onEditFloor(floor)"
                                    :aria-label="`Edit ${floor.name} floor plan`"
                                />
                                <v-btn
                                    variant="text"
                                    icon="fa fa-trash"
                                    color="error"
                                    size="small"
                                    @click="onRemoveFloor(index)"
                                    :disabled="!canDeleteFloor(floor.id)"
                                    :aria-label="`Remove ${floor.name} floor plan`"
                                />
                            </div>
                        </template>
                    </v-list-item>
                </v-card>
            </div>
        </div>

        <div v-else-if="!availableFloors?.length" class="text-center text-grey-darken-1 pa-4">
            No floor plans available to add or manage.
        </div>
    </div>
</template>

<style scoped>
.cursor-move {
    cursor: move;
}
</style>
