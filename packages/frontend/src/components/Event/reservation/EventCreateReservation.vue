<script setup lang="ts">
import type { Reservation, User } from "@firetable/types";
import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";

const props = defineProps<{
    users: User[];
    mode: "create" | "edit";
    eventStartTimestamp: number;
    table: BaseTable;
    floor: FloorViewer;
    /**
     *  Optional data for editing
     */
    reservationData?: Reservation;
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation): void;
}>();

function handleReservationCreate(reservation: Reservation): void {
    emit("create", reservation);
}

function handleReservationUpdate(reservation: Reservation): void {
    emit("update", reservation);
}
</script>

<template>
    <PlannedReservationForm
        :mode="props.mode"
        :event-start-timestamp="props.eventStartTimestamp"
        :floor="props.floor"
        :users="props.users"
        :table="props.table"
        @create="handleReservationCreate"
        @update="handleReservationUpdate"
    />
</template>
