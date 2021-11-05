<template>
    <div class="row text-center q-col-gutter-md">
        <div class="col-4">Total tables: {{ props.reservationsStatus.total }}</div>
        <div class="col-4">Reserved: {{ props.reservationsStatus.reserved }}</div>
        <div class="col-4">Pending: {{ props.reservationsStatus.pending }}</div>
        <div class="col-4">Confirmed: {{ props.reservationsStatus.confirmed }}</div>
        <div class="col-4">Free: {{ props.reservationsStatus.unreserved }}</div>
    </div>
</template>

<script setup lang="ts">
interface ReservationsStatus {
    total: number;
    reserved: number;
    pending: number;
    confirmed: number;
    unreserved: number;
}

interface Props {
    reservationsStatus: ReservationsStatus;
}

const props = defineProps<Props>();
</script>
