<template>
    <div class="row text-center q-col-gutter-md">
        <div class="col-4 text-subtitle1">Total tables: {{ props.reservationsStatus.total }}</div>
        <div class="col-4 text-subtitle1">Reserved: {{ props.reservationsStatus.reserved }}</div>
        <div class="col-4 text-subtitle1">Pending: {{ props.reservationsStatus.pending }}</div>
        <div class="col-4 text-subtitle1">Confirmed: {{ props.reservationsStatus.confirmed }}</div>
        <div class="col-4 text-subtitle1">Free: {{ props.reservationsStatus.unreserved }}</div>
        <div class="col-4 text-subtitle1">Cancelled: {{ props.reservationsStatus.cancelled }}</div>
        <div class="col-4 text-subtitle1">
            Total Guests: {{ props.reservationsStatus.totalGuests }}
        </div>
    </div>
</template>

<script setup lang="ts">
interface ReservationsStatus {
    total: number;
    reserved: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    unreserved: number;
    totalGuests: number;
}

interface Props {
    reservationsStatus: ReservationsStatus;
}

const props = defineProps<Props>();
</script>
