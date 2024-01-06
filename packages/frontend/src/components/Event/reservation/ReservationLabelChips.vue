<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import { isAWalkInReservation } from "@firetable/types";

const props = defineProps<{
    reservation: ReservationDoc;
}>();
</script>

<template>
    <div class="row justify-end">
        <q-chip v-if="isAWalkInReservation(props.reservation)" color="quaternary" label="Walk-In" />
        <q-chip
            color="accent"
            v-if="props.reservation.isVIP"
            label="VIP"
            icon="crown"
            text-color="yellow"
        />
    </div>
</template>
