<script setup lang="ts">
import type { EventFloorDoc, FloorDoc, ReservationDoc } from "@firetable/types";
import type { SortableEvent } from "vue-draggable-plus";
import { computed } from "vue";
import { vDraggable } from "vue-draggable-plus";
import { buttonSize, isMobile } from "src/global-reactives/screen-detection";

export interface AdminEventFloorManagerProps {
    /** List of current floors */
    floors: EventFloorDoc[];
    /** Floors that can be added (for edit mode) */
    availableFloors?: FloorDoc[];
    /** Used to check if floor can be deleted */
    reservations?: ReservationDoc[];
    showEditButton?: boolean;
    /** Maximum number of floors allowed */
    maxFloors: number;
}

interface Emits {
    (event: "add" | "edit", floor: EventFloorDoc): void;
    (event: "remove", index: number): void;
    (event: "reorder", floors: EventFloorDoc[]): void;
}

const props = defineProps<AdminEventFloorManagerProps>();
const emit = defineEmits<Emits>();
const draggableFloors = computed(() => [...props.floors]);
const draggableOptions = computed(() => ({
    animation: 150,
    onEnd: onDrop,
    ...(isMobile.value
        ? {
              handle: ".drag-handle",
          }
        : {}),
}));

const floorsWithReservations = computed(function (): Set<string> {
    if (!props.reservations) {
        return new Set<string>();
    }

    return new Set(props.reservations.map((reservation) => reservation.floorId));
});

function canDeleteFloor(floorId: string): boolean {
    return !floorsWithReservations.value.has(floorId);
}

const remainingFloors = computed(() => {
    if (!props.maxFloors) {
        return;
    }
    return props.maxFloors - props.floors.length;
});

function onAddFloor(floor: EventFloorDoc): void {
    if (remainingFloors.value === 0) {
        return;
    }
    emit("add", {
        ...floor,
        id: floor.id,
        order: props.floors.length,
    });
}

function onRemoveFloor(index: number): void {
    emit("remove", index);
}

function onEditFloor(floor: EventFloorDoc): void {
    emit("edit", floor);
}

function onDrop(event: SortableEvent): void {
    const { oldDraggableIndex, newDraggableIndex } = event;
    if (
        oldDraggableIndex === newDraggableIndex ||
        oldDraggableIndex === undefined ||
        newDraggableIndex === undefined
    ) {
        return;
    }

    const newFloors = [...props.floors];
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
</script>

<template>
    <div class="EventFloorManager">
        <div v-if="availableFloors?.length" class="row items-center justify-between q-mb-md">
            <div>
                <div class="text-h6">Floor plans</div>
                <div v-if="maxFloors" class="text-caption text-grey-7">
                    {{ floors.length }}/{{ maxFloors }} floors used
                </div>
            </div>
            <q-btn
                flat
                rounded
                :size="buttonSize"
                color="primary"
                icon="plus"
                class="button-gradient"
                aria-label="Add floor plan"
                :disabled="remainingFloors === 0"
            >
                <q-tooltip v-if="remainingFloors === 0">
                    Maximum number of floors ({{ maxFloors }}) reached
                </q-tooltip>
                <q-menu class="ft-card">
                    <q-list>
                        <q-item
                            v-for="floor in availableFloors"
                            :key="floor.id"
                            clickable
                            v-close-popup
                            @click="onAddFloor(floor)"
                            :aria-label="`Add ${floor.name} floor plan`"
                        >
                            <q-item-section>{{ floor.name }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </div>

        <q-list v-draggable="[draggableFloors, draggableOptions]" class="q-gutter-y-sm">
            <q-item
                v-for="(floor, index) in floors"
                :key="`${floor.id}-${index}`"
                class="ft-card"
                :aria-label="`${floor.id} draggable floor plan item`"
            >
                <q-item-section avatar>
                    <q-icon name="drag" class="drag-handle cursor-move" />
                </q-item-section>

                <q-item-section>
                    <q-item-label>{{ floor.name }}</q-item-label>
                    <q-item-label caption v-if="!canDeleteFloor(floor.id)">
                        Has active reservations
                    </q-item-label>
                </q-item-section>

                <q-item-section side class="row items-center">
                    <q-btn
                        v-if="showEditButton"
                        flat
                        round
                        color="primary"
                        icon="pencil"
                        size="sm"
                        @click="onEditFloor(floor)"
                        :aria-label="`Edit ${floor.name} floor plan`"
                    />
                    <q-btn
                        flat
                        round
                        color="negative"
                        icon="trash"
                        size="sm"
                        @click="onRemoveFloor(index)"
                        :disabled="!canDeleteFloor(floor.id)"
                        :aria-label="`Remove ${floor.name} floor plan`"
                    />
                </q-item-section>
            </q-item>
        </q-list>
    </div>
</template>
