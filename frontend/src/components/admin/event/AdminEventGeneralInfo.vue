<template>
    <div>
        <div>Total: {{ props.reservationsStatus.total }}</div>
        <div>Reserved: {{ props.reservationsStatus.reserved }}</div>
        <div>Pending: {{ props.reservationsStatus.pending }}</div>
        <div>Confirmed: {{ props.reservationsStatus.confirmed }}</div>
        <div>Free: {{ props.reservationsStatus.unreserved }}</div>
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

// eslint-disable-next-line no-undef
const props = defineProps<Props>();
</script>
