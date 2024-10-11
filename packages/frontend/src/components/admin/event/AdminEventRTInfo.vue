<script setup lang="ts">
interface ReservationsStatus {
    total: number;
    currentlyOccupied: number;
    pending: number;
    totalGuests: number;
}

interface Props {
    reservationsStatus: ReservationsStatus;
}

const { reservationsStatus } = defineProps<Props>();
</script>

<template>
    <div class="row text-center justify-between">
        <q-chip color="primary" :label="`Total tables: ${reservationsStatus.total}`" />

        <q-chip
            color="secondary"
            :label="`Currently Occupied: ${reservationsStatus.currentlyOccupied}`"
        />

        <q-chip color="tertiary" :label="`Pending: ${reservationsStatus.pending}`" />

        <q-chip color="quaternary" :label="`Total Guests: ${reservationsStatus.totalGuests}`" />
    </div>
</template>
