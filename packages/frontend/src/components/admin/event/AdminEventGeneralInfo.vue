<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";

interface ReservationsStatus {
    total: number;
    currentlyOccupied: number;
    pending: number;
    totalGuests: number;
}

interface Props {
    reservationsStatus: ReservationsStatus;
}

const props = defineProps<Props>();
</script>

<template>
    <div class="row text-center q-col-gutter-md">
        <FTCenteredText class="col-12">Real Time Info</FTCenteredText>

        <div class="col-4 text-subtitle1">
            <q-chip color="primary" :label="`Total tables: ${props.reservationsStatus.total}`" />
        </div>
        <div class="col-4 text-subtitle1">
            <q-chip
                color="secondary"
                :label="`Currently Occupied: ${props.reservationsStatus.currentlyOccupied}`"
            />
        </div>
        <div class="col-4 text-subtitle1">
            <q-chip color="tertiary" :label="`Pending: ${props.reservationsStatus.pending}`" />
        </div>
        <div class="col-4 text-subtitle1">
            <q-chip
                color="quaternary"
                :label="`Total Guests: ${props.reservationsStatus.totalGuests}`"
            />
        </div>
    </div>
</template>
